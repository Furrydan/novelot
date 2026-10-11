mongoimport --db novelot --collection novels --file /data/import/novelList.json --jsonArray
mongoimport --db novelot --collection users --file /data/import/userList.json --jsonArray
mongoimport --db novelot --collection chapters --file /data/import/chapterList.json --jsonArray
