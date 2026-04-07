const Inventory = require('../models/Inventory');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configure Gemini (Replace with actual API key from .env)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AI_KEY_REPLACED');

const processMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const userMessage = message.toLowerCase().trim();
    
    let botResponse = "";
    let data = null;
    let action = null;

    // 1. Structured Database Actions (Rules for precision)
    
    // Command: List all products
    if (userMessage.includes('list') || userMessage.includes('all products') || userMessage.includes('show items')) {
      const allItems = await Inventory.find({});
      if (allItems.length === 0) {
        return res.json({ message: "Your inventory is currently empty. Would you like to add something now?" });
      }
      botResponse = `Of course! You have ${allItems.length} types of products in stock:`;
      data = allItems.map(i => `${i.name}: ${i.quantity} units (Price: ₹${i.price})`);
      return res.json({ message: botResponse, data });
    }

    // Command: Show low stock
    if (userMessage.includes('low stock')) {
      const lowStock = await Inventory.find({ quantity: { $gt: 0, $lt: 5 } });
      botResponse = lowStock.length > 0 
        ? `Here are the items running low (less than 5 left):` 
        : "Excellent! All your items are currently well-stocked.";
      data = lowStock.map(i => `${i.name}: only ${i.quantity} units left`);
      return res.json({ message: botResponse, data });
    }

    // Command: Inventory Summary / Stats
    if (userMessage.includes('summary') || userMessage.includes('total') || userMessage.includes('stats')) {
      const all = await Inventory.find({});
      const totalUnits = all.reduce((a,b) => a + b.quantity, 0);
      const totalValue = all.reduce((a,b) => a + (b.quantity * b.price), 0);
      botResponse = `Here is your current inventory summary:`;
      data = [
        `Total Products: ${all.length}`,
        `Total Units: ${totalUnits}`,
        `Total Estimated Value: ₹${totalValue.toFixed(2)}`
      ];
      return res.json({ message: botResponse, data });
    }

    // Command: Add product via chat
    if (userMessage.startsWith('add ')) {
      const addMatch = userMessage.match(/add\s+(\d+)\s+([a-zA-Z\s]+)(?:\s+with\s+price\s+|\s+at\s+|\s+)(\d+)?/i);
      if (addMatch) {
         const quantity = parseInt(addMatch[1]);
         const name = addMatch[2].trim();
         const price = addMatch[3] ? parseFloat(addMatch[3]) : 0;
         const newProduct = await Inventory.create({ 
           name: name.charAt(0).toUpperCase() + name.slice(1), 
           quantity, 
           price, 
           category: 'General',
           createdBy: req.user.name 
         });
         
         const { broadcastStats } = require('./statsController');
         if (req.io) {
           req.io.emit('product_added', newProduct);
           broadcastStats(req.io);
         }
         return res.json({ message: `✅ Done! I've added ${quantity} units of '${newProduct.name}' to the inventory.` });
      }
    }

    // 2. OpenAI/Gemini for "Smart Conversation"
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'AI_KEY_REPLACED') {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const chatContext = "You are SmartStock AI, a helpful inventory assistant. Be concise and smart. Don't use too much markdown. Treat the user like a CEO managing their stock.";
        const result = await model.generateContent(`${chatContext}\nUser asks: ${message}`);
        botResponse = result.response.text();
      } catch (aiError) {
        console.error("AI Error:", aiError);
        botResponse = "I'm having some trouble with my AI core, but I can still help with commands like 'list products' or 'add product'.";
      }
    } else {
       // Deeply helpful fallback if no API key
       botResponse = "I'm your Inventory Assistant. I can help you with: \n• 'List all products' \n• 'Show low stock' \n• 'Inventory summary' \n• 'Add 10 sugar at 50'";
    }

    res.json({ message: botResponse, data, action });

  } catch (error) {
    res.status(500).json({ message: "Something went wrong in the command center." });
  }
};

module.exports = { processMessage };
