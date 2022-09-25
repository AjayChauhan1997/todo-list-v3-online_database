const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const _ = require('lodash')

//for mongodb
//const url='mongodb://localhost:27017/todolistDB';

const url="mongodb+srv://admin-ajay:123@cluster0.khdy3lr.mongodb.net/login?retryWrites=true&w=majority"
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true});
const db=mongoose.connection;
db.on("error",()=>{console.log("db not connected!")});
db.once("open",function(){
    console.log("success");
});





app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


//Global variables
const notFoundItems = [{ todo: "Add your First TODO" }];
const blankItem = [];


//to provide date to ejs with customised format
var today = new Date();
var options = {
    weekday: "long",
    day: "numeric",
    month: "long"
}
var day = today.toLocaleDateString("en-US", options);

//schema for todo
const todoSchema = new mongoose.Schema({
    todo: {
        type: String,
        min: 1,
        required: [true, "Fail! todo Not given "]
    }
});

//schema for todo with custum todo generated by user
const customLististSchema = {
    name: String,
    items: [todoSchema]
}


//Mongoose models
const todoHome = mongoose.model("homeTodolist", todoSchema);
const customList = mongoose.model("customList", customLististSchema);


//Home or default route
app.get("/", function (req, res) {
    todoHome.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            res.render('list', { tittle: "Home", kindofday: day, newlist: notFoundItems });
        } else {
            res.render('list', { tittle: "Home", kindofday: day, newlist: foundItems });
        }
    });
});


app.post("/", function (req, res) {
    var item = req.body.todo;
    var btn = req.body.button;
    const todo = new todoHome({
        todo: item
    });
    if (btn === "Home") {
        todo.save();
        res.redirect("/");
    } else {
        customList.findOne({ name: btn }, function (err, foundList) {
            foundList.items.push(todo);
            foundList.save();
        });
        res.redirect("/" + btn);
    }
});



app.post("/delete", function (req, res) {
    const deleteItem = req.body.checkbox;
    const listName = req.body.listname;
    if (listName === "Home") {
        todoHome.findByIdAndRemove(deleteItem, function (err) {
            if (err) {
                console.log(err);
            }
            res.redirect("/");
        });
    } else {
        customList.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: deleteItem } } }, function (err, foundlist) {
            if (!err) {
                res.redirect("/" + listName);
            } else {
                console.log(err);
                res.redirect("/" + listName);
            }
        });
    }

});
app.post("/help",function(req,res){
    res.render("help");
    });

app.get("/:newRoute", function (req, res) {
    const customListName = _.capitalize(req.params.newRoute);
    customList.findOne({ name: customListName }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                const NewList = new customList({
                    name: customListName,
                    items: blankItem
                });
                NewList.save();
                res.redirect("/" + customListName);
            } else {
                res.render('list', { tittle: customListName, kindofday: day, newlist: foundList.items });
            }
        }
    });
});

let port=process.env.PORT;
if(port == null || port==""){
    port=3000;
} 

app.listen(port, function () {
    console.log("SERVER IS  RUNNING  ");
});