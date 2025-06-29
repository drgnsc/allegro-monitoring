/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3927043399")

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "select1707687987",
    "maxSelect": 1,
    "name": "matchType",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "url",
      "title",
      "brand"
    ]
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3774658137",
    "max": 1000,
    "min": 1,
    "name": "matchValue",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "bool1260321794",
    "name": "active",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3927043399")

  // remove field
  collection.fields.removeById("select1707687987")

  // remove field
  collection.fields.removeById("text3774658137")

  // remove field
  collection.fields.removeById("bool1260321794")

  return app.save(collection)
})
