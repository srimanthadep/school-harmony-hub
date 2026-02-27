const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // For Atlas DNS fix
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkExpenses() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const Expense = require('./models/Expense');

        const expenses = await Expense.find().sort({ date: -1 });
        console.log(`Found ${expenses.length} expenses.`);

        expenses.forEach(exp => {
            console.log(`[${exp.date ? new Date(exp.date).toLocaleDateString() : 'N/A'}] ${exp.category}: ${exp.amount} - ${exp.description}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Error fetching expenses:', err.message);
        process.exit(1);
    }
}

checkExpenses();
