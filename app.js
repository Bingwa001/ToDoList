const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", { useNewUrlParser: true });



const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const Item1 = new Item({
  name: "Welcome to your todolist!"
});

const Item2 = new Item({
  name: "Hit the ++ button to add!"
});

const Item3 = new Item({
  name: "Hit the -- button to delete!"
});

const defaultItems = [Item1, Item2, Item3];



const ListSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", ListSchema); 




app.get("/", async function (req, res) {
  try {
    const foundItems = await Item.find({});
    console.log("Found Items:", foundItems); // Add this line

    if (foundItems.length === 0) {
      await Item.insertMany(defaultItems);
      console.log("Successfully saved default items to the database!");
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  } catch (err) {
    console.error(err);
  }
});



app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  try {
    const foundList = await List.findOne({ name: customListName });

    if (!foundList) {
      // Create a new list if it doesn't exist
      const newList = new List({
        name: customListName,
        items: defaultItems
      });

      await newList.save();
      res.redirect("/" + customListName);
    }

    // Retrieve items for the list (whether new or existing)
    const foundItems = foundList ? foundList.items : defaultItems;

    res.render("list", { listTitle: customListName, newListItems: foundItems });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error finding/creating custom list");
  }
});





  

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.listName; // Use req.body.listName instead of req.body.list

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    try {
      await item.save();
      return res.redirect("/");
    } catch (err) {
      console.error(err);
      return res.status(500).send("Error processing request");
    }
  } else {
    try {
      const foundList = await List.findOne({ name: listName });

      if (!foundList) {
        console.error("List not found");
        return res.status(404).send("List not found");
      }

      foundList.items.push(item);
      await foundList.save();
      return res.redirect("/" + listName);
    } catch (err) {
      console.error(err);
      return res.status(500).send("Error processing request");
    }
  }
});





app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  try {
    if (listName === "Today") {
      await Item.findByIdAndRemove(checkedItemId);
    } else {
      const foundList = await List.findOne({ name: listName });

      if (!foundList) {
        console.error("List not found");
        return res.status(404).send("List not found");
      }

      foundList.items.pull({ _id: checkedItemId });
      await foundList.save();
    }

    console.log("Successfully deleted checked item!");
    // Redirect back to the same page, preserving the current list
    res.redirect("/" + listName);
  } catch (err) {
    console.error("Error deleting checked item:", err);
    res.status(500).send("Error deleting checked item");
  }
});





app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});