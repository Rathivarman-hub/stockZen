const Inventory = require('../models/Inventory');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AI_KEY_REPLACED');

const processMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const userMessage = message.toLowerCase().trim();

    let botResponse = '';
    let data = null;

    // ─── 1. Structured Rule-Based Commands ────────────────────────────────────

    // Command: List all products
    if (userMessage.includes('list') || userMessage.includes('all products') || userMessage.includes('show items')) {
      const allItems = await Inventory.find({});
      if (allItems.length === 0) {
        return res.json({ message: "Your inventory is currently empty. Would you like to add something now?" });
      }
      botResponse = `You have ${allItems.length} product(s) in stock:`;
      data = allItems.map(i => `${i.name}: ${i.quantity} units @ ₹${i.price}`);
      return res.json({ message: botResponse, data });
    }

    // Command: Show low stock
    if (userMessage.includes('low stock')) {
      const lowStock = await Inventory.find({ quantity: { $gt: 0, $lt: 5 } });
      botResponse = lowStock.length > 0
        ? `⚠️ ${lowStock.length} item(s) running critically low (under 5 units):`
        : '✅ All items are currently well-stocked.';
      data = lowStock.map(i => `${i.name}: only ${i.quantity} unit(s) left`);
      return res.json({ message: botResponse, data });
    }

    // Command: Show out of stock
    if (userMessage.includes('out of stock') || userMessage.includes('zero stock')) {
      const oos = await Inventory.find({ quantity: 0 });
      botResponse = oos.length > 0
        ? `❌ ${oos.length} item(s) are completely out of stock:`
        : '✅ No out-of-stock items right now!';
      data = oos.map(i => `${i.name} (₹${i.price})`);
      return res.json({ message: botResponse, data });
    }

    // Command: Inventory Summary / Stats
    if (userMessage.includes('summary') || userMessage.includes('total') || userMessage.includes('stats') || userMessage.includes('overview')) {
      const all = await Inventory.find({});
      const totalUnits = all.reduce((a, b) => a + b.quantity, 0);
      const totalValue = all.reduce((a, b) => a + (b.quantity * b.price), 0);
      const outOfStock  = all.filter(i => i.quantity === 0).length;
      const lowStock    = all.filter(i => i.quantity > 0 && i.quantity < 5).length;
      botResponse = '📊 Here is your live inventory summary:';
      data = [
        `Total Products: ${all.length}`,
        `Total Units: ${totalUnits}`,
        `Total Estimated Value: ₹${totalValue.toFixed(2)}`,
        `Out of Stock: ${outOfStock} item(s)`,
        `Low Stock Alerts: ${lowStock} item(s)`,
      ];
      return res.json({ message: botResponse, data });
    }

    // Command: Most valuable product
    if (userMessage.includes('most valuable') || userMessage.includes('highest value')) {
      const all = await Inventory.find({ quantity: { $gt: 0 } });
      if (all.length === 0) return res.json({ message: 'No products in stock to evaluate.' });
      const sorted = all.sort((a, b) => (b.quantity * b.price) - (a.quantity * a.price));
      const top = sorted.slice(0, 3);
      botResponse = '💰 Your top 3 most valuable stock items are:';
      data = top.map((i, idx) => `#${idx + 1} ${i.name}: ${i.quantity} units × ₹${i.price} = ₹${(i.quantity * i.price).toFixed(2)}`);
      return res.json({ message: botResponse, data });
    }

    // Command: Add product via chat
    if (userMessage.startsWith('add ')) {
      const addMatch = userMessage.match(/add\s+(\d+)\s+([a-zA-Z\s]+?)(?:\s+(?:with price|at|price)\s+(\d+(?:\.\d+)?))?$/i);
      if (addMatch) {
        const quantity = parseInt(addMatch[1]);
        const name     = addMatch[2].trim();
        const price    = addMatch[3] ? parseFloat(addMatch[3]) : 0;
        const newProduct = await Inventory.create({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          quantity,
          price,
          category: 'General',
          createdBy: req.user.name,
        });

        const { broadcastStats } = require('./statsController');
        if (req.io) {
          req.io.emit('product_added', newProduct);
          broadcastStats(req.io);
        }
        return res.json({ message: `✅ Done! Added ${quantity} unit(s) of '${newProduct.name}' at ₹${price} each.` });
      }
    }

    // ─── 2. Context-Aware Gemini AI ───────────────────────────────────────────
    // Build a live inventory context to inject into the AI prompt
    const all = await Inventory.find({});
    const totalUnits = all.reduce((a, b) => a + b.quantity, 0);
    const totalValue = all.reduce((a, b) => a + (b.quantity * b.price), 0);
    const lowStockItems = all.filter(i => i.quantity > 0 && i.quantity < 5);
    const outOfStockItems = all.filter(i => i.quantity === 0);

    // Summarise each product (truncated if large)
    const productLines = all
      .slice(0, 40) // cap to 40 to avoid token overflow
      .map(i => `- ${i.name} (${i.category}): qty=${i.quantity}, price=₹${i.price}, status=${i.status}`)
      .join('\n');

    const inventoryContext = `
=== LIVE INVENTORY SNAPSHOT ===
Total Products : ${all.length}
Total Units    : ${totalUnits}
Total Value    : ₹${totalValue.toFixed(2)}
Low Stock (<5) : ${lowStockItems.map(i => i.name).join(', ') || 'None'}
Out of Stock   : ${outOfStockItems.map(i => i.name).join(', ') || 'None'}

PRODUCT DETAILS:
${productLines}
================================
`.trim();

    const systemPrompt = `You are SmartStock AI, an intelligent inventory management assistant embedded in StockZen IMS.
Be concise, practical and insightful. Avoid excessive markdown symbols. Treat the user like a business owner who needs quick answers.
You have access to the following live inventory data — use it to answer questions accurately:

${inventoryContext}

Capabilities you can remind users about:
• "list all products" — show full inventory
• "low stock" / "out of stock" — specific alerts
• "summary" or "stats" — totals and value
• "most valuable" — top products by value
• "add 10 sugar at 50" — quick stock addition via chat`;

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'AI_KEY_REPLACED') {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(`${systemPrompt}\n\nUser: ${message}`);
        botResponse = result.response.text();
      } catch (aiError) {
        console.error('Gemini AI Error:', aiError);
        botResponse = "My AI core is temporarily unavailable. Try commands like 'show low stock' or 'inventory summary'.";
      }
    } else {
      botResponse = `I can help with:\n• 'list all products'\n• 'show low stock'\n• 'inventory summary'\n• 'most valuable items'\n• 'add 10 sugar at 50'`;
    }

    res.json({ message: botResponse, data });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ message: 'Something went wrong in the command center.' });
  }
};

module.exports = { processMessage };
