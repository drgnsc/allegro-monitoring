/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3927043399")

  // add field projectId
  collection.fields.addAt(6, new Field({
    "cascadeDelete": true,
    "collectionId": "pbc_484305853", // projects collection ID
    "hidden": false,
    "id": "relation_project_id",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "projectId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3927043399")

  // remove field
  collection.fields.removeById("relation_project_id")

  return app.save(collection)
}) 