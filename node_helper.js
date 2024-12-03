// noinspection JSVoidFunctionReturnValueUsed

/* Magic Mirror
 * Node Helper: MMM-Notion
 *
 * By Cedrik Hoffmann
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const Log = require("logger");
const {Client} = require("@notionhq/client");
const { updatePage } = require("@notionhq/client/build/src/api-endpoints");

module.exports = NodeHelper.create({
	start: function () {
		Log.log(`${this.name} is started`);
		this.calls = []
	},

	socketNotificationReceived: async function (notification, payload) {
		switch (notification) {
			case "MMM-NOTION-HERE_IS_YOUR_CONFIG":
				this.calls.push({callId: payload.callId, secret: payload.secret, databases: payload.databases })
				break;
			case "MMM-NOTION-UPDATE_PLEASE":
				const callElement = this.calls.filter(e => e.callId === payload)
				if (callElement.length === 1) {
					const call = callElement[0]
					await this.makeRequest(call, (error) => this.handleError(error, call.callId));
				}
				break;
			case "MMM-NOTION-UPDATE_QUANTITY":
				const callElement2 = this.calls.filter(e => e.callId === payload.callId)
				if (callElement2.length === 1) {
					const call = callElement2[0]
					await this.updateQuantity(call, payload.rowId, payload.newValue, (error) => this.handleError(error, call.callId));
				}
				break;
			case "MMM-NOTION-UPDATE_TITLE":
				const callElement3 = this.calls.filter(e => e.callId === payload.callId)
				if (callElement3.length === 1) {
					const call = callElement3[0]
					await this.updateItemText(call, payload.rowId, payload.newValue, (error) => this.handleError(error, call.callId));
				}
				break;
			case "MMM-NOTION-ADD_ROW":
				const callElement4 = this.calls.filter(e => e.callId === payload.callId)
				if (callElement4.length === 1) {
					const call = callElement4[0]
					// Rather than using databases[0], figure out a better way to get (even from notion.js) the database id - is it hardcoded and in the config?
					await this.addRow(call, call.databases[0].id, payload.title, (error) => this.handleError(error, call.callId));
				}
				break;	
			case "MMM-NOTION-DELETE_ROW":
				const callElement5 = this.calls.filter(e => e.callId === payload.callId)
				if (callElement5.length === 1) {
					const call = callElement5[0]
					await this.deleteRow(call, payload.rowId, (error) => this.handleError(error, call.callId));
				}
				break;
		}
	},

	makeRequest: async function (call, onError) {
		const notion = new Client({auth: call.secret})
		try {
			for (const database of call.databases) {
				const data = await this.makeQuery(notion, database)
				if (database.data === undefined) database.data = []
				database.data = data.results
			}
			this.sendSocketNotification(`MMM-Notion-DATABASE-DATA-${call.callId}`, call.databases);
		} catch (e) {
			onError(e)
		}
	},

	updateItemText: async function (call, rowId, newValue, onError) {
		try {
			const notion = new Client({ auth: call.secret});
			const response = await notion.pages.update({
				page_id: rowId,
				properties: {
				  	'Item': {
						title: [{
							text: {
								content: newValue,
							},
						}]
				  	},
				},
			});
			//console.log(response);
		} catch (e) {
			onError(e)
		}
	},
	updateQuantity: async function (call, rowId, newValue, onError) {
		
		try {
			const notion = new Client({ auth: call.secret});
			const response = await notion.pages.update({
				page_id: rowId,
				properties: {
				  'Quantity': {
					number: parseInt(newValue),
				  },
				},
			  });
			//  console.log(response);
		} catch (e) {
			onError(e)
		}
	},
	addRow: async function (call, databaseId, title) {
		const notion = new Client({ auth: call.secret });
		(async () => {
			const response = await notion.pages.create({
				"parent": {
					"type": "database_id",
					"database_id": databaseId
				},
				"properties": {
					"Item": {
						"title": [
							{
								"text": {
									"content": title
								}
							}
						]
					},
					// FIXME - For now, all databases have the same columns and names, so Add works. I'm sure there are better ways :)
					"Quantity": {
						"number": 1
					}
				},
			});
			console.log(response);
		})();

	},

	deleteRow: async function (call, rowId, onError) {
		
		try {
			const notion = new Client({ auth: call.secret});
			const response = await notion.pages.update({
				page_id: rowId,
				archived: true,
			  });
			  //console.log(response);
		} catch (e) {
			onError(e)
		}
	},

	makeQuery: async function (notion, database) {
		return await notion.databases.query(this.setQueryArguments(database))
	},

	setQueryArguments: function (database) {
		// Check if database.filter is empty
		if (database.filter === undefined || database.filter == null || Object.keys(database.filter).length === 0) {
			return {
				database_id: database.id,
				sorts: database.sorts
			}
		} else {
			return {
				database_id: database.id,
				filter: database.filter,
				sorts: database.sorts
			}
		}
	},

	handleError: function (error, id) {
		Log.error(error)
		this.sendSocketNotification(`MMM-Notion-DATABASE-ERROR-${id}`, error);
	}
});
