//jshint esversion:6

const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

//connect to database
//mongoose.connect("mongodb://localhost:27017/todolistDB");
mongoose.connect("mongodb+srv://visconttig2015v2:" + process.env.ATLAS_PASSWORD + "@cluster0.xokad.mongodb.net/todolistDB");
app.set('view engine', 'ejs');


app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

const itemsSchema = mongoose.Schema({
  itemName: String
});

const Item = new mongoose.model("Item", itemsSchema);

const item1 = new Item({
  itemName: "Welcome to your To-do List!"
});

const item2 = new Item({
  itemName: "Click the + symbol to add an item."
});

const item3 = new Item({
  itemName: "<--- Check items to delete them."
});

const defaultItems = [item1, item2, item3];


const workItems = [];

const listSchema = mongoose.Schema({
  listName: String,
  items: [itemsSchema]
});

const List = new mongoose.model("List", listSchema);


app.get("/", function(req, res) {
  Item.find({}, function(err, foundItems) {
    if (err) {
      console.log(err);
    } else {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log("Default items succesfully inserted into database.");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {
          listTitle: "Today",
          newListItems: foundItems
        });
      }
    }
  });
});

app.post("/", function(req, res) {
  const item = req.body.newItem;
  const listName = req.body.list;

  const newUserItem = new Item({
    itemName: item
  });

if(listName === "Today"){
  newUserItem.save();
  res.redirect("/");
} else {
  List.findOne({listName: listName}, function(err, foundList){
    if(err){
      console.log(err);
    } else {
      foundList.items.push(newUserItem);
      foundList.save();
      console.log("Item saved to database.");
      res.redirect("/" + listName);
    }
  });
}

});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkedItem;
  const listTitle = req.body.hidden;

  if(listTitle === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(err){
        console.log(err);
      } else {
        console.log("Item succesfully deleted from database.");
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({listName: listTitle},
      {$pull: {items: {_id: checkedItemId}}}, function(err){
        if(err){
          console.log(err);
        } else {
          console.log("Item succesfully deleted from database.");
        }
      });
      res.redirect("/" + listTitle);
  }
});

app.get("/:customListName", function(req, res){
  customListNameCap= _.capitalize(req.params.customListName);

List.findOne({listName: customListNameCap}, function(err, result){
  if(err){
    console.log(err);
  } else {
    if(result){
      console.log("LIST ALREADY EXISTS");
      // show existing list
      res.render("list", {listTitle: result.listName,
      newListItems: result.items});
    } else {
      console.log("Creating new list...");
      // create new list
      const newList = new List({
        listName: customListNameCap,
        items: defaultItems
      });

      newList.save();
      res.redirect("/" + customListNameCap);
    }
  }
});

});


app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
