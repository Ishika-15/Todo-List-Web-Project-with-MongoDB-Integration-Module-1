require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const methodOverride = require('method-override');

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

mongoose.connect(process.env.MONGO_URI, {})
.then(() => console.log('🔗 Database connected successfully!'))
.catch(err => console.warn("🚨 MongoDB Connection Error:", err));

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'high', 'urgent'],
        default: 'low'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const TodoItem = mongoose.model('TodoItem', taskSchema);

app.get('/', async (req, res) => {
    try {
        const tasks = await TodoItem.find({}).sort({ createdAt: -1 });
        res.render('index', { 
            tasks, 
            message: req.query.message,
            alertClass: req.query.alertClass || ''
        });
    } catch (err) {
        console.warn("An operation failed (GET /):", err);
        res.redirect('/?message=Error loading tasks&alertClass=error');
    }
});

app.post('/tasks', async (req, res) => {
    const { title, priority } = req.body;
    
    if (!title.trim()) {
        return res.redirect('/?message=Can\'t add an empty task!&alertClass=error'); 
    }

    try {
        const newTask = new TodoItem({ title, priority });
        await newTask.save();
        res.redirect('/?message=New item saved!&alertClass=success'); 
    } catch (err) {
        console.warn("An operation failed (POST /tasks):", err);
        res.redirect('/?message=Error adding task&alertClass=error');
    }
});

app.put('/tasks/:id', async (req, res) => {
    const { title, priority } = req.body;
    
    if (!title.trim()) {
        return res.redirect('/?message=Please enter a task!&alertClass=error');
    }

    try {
        await TodoItem.findByIdAndUpdate(req.params.id, { title, priority });
        res.redirect('/?message=Update successful!&alertClass=success'); 
    } catch (err) {
        console.warn("An operation failed (PUT /tasks/:id):", err);
        res.redirect('/?message=Error updating task&alertClass=error');
    }
});

app.delete('/tasks/:id', async (req, res) => {
    try {
        await TodoItem.findByIdAndDelete(req.params.id);
        res.redirect('/?message=Task removed!&alertClass=success');
    } catch (err) {
        console.warn("An operation failed (DELETE /tasks/:id):", err);
        res.redirect('/?message=Error deleting task&alertClass=error');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server up on http://localhost:${PORT}`));
