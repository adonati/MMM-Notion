/* Magic Mirror
 * Module: MMM-Notion
 *
 * By Cedrik Hoffmann
 * MIT Licensed.
 */

class ListView {
	constructor(databaseProps,rootObject) {
		this.databaseProps = databaseProps
		this.wrapper = this.createListWrapper()
		this.rootObject = rootObject
		this.init()
	}

	init() {
		this.createElements()
	}

	createListWrapper() {
		const list = document.createElement("div")
		list.id = "mmm-notion-listview"
		return list
	}

	createElements() {
		this.databaseProps.data.forEach(props => {
			const config = {
				dateFormat: this.databaseProps.layout.dateFormat,
				showPersonWithNames: this.databaseProps.layout.showPersonWithNames,
				displayProps: this.databaseProps.layout.properties,
				database_id: this.databaseProps.id,
				displayElementTitle: this.databaseProps.layout.displayElementTitle,
			}
			const element = new ListViewElement(props, config, this.rootObject)
			this.wrapper.appendChild(element.wrapper)
		})
		this.createNewElementPlaceholder()
	}

	createNewElementPlaceholder() {
		const newItemWrapper = document.createElement("div")
		newItemWrapper.id = "mmm-notion-listview-element"

		const newItemContainer = document.createElement("div")
		newItemContainer.id = "mmm-notion-listview-titleContainer"

		const newItem = document.createElement("div")
		newItem.id = "mmm-notion-listview-title"

		newItem.classList = "notionListItem notionNewItem"
		newItem.innerText = "Add an item..."
		newItemContainer.appendChild(newItem)
		
		// Additional properties to edit
		const buttonBar = document.createElement("div")
		buttonBar.className = "editItemButtonBar hideMe"
		const titleEditOK = document.createElement("i")
		titleEditOK.className = "editButton fa-regular fa-circle-check"
		titleEditOK.style = "color:green"
		buttonBar.appendChild(titleEditOK)

		const titleEditCancel = document.createElement("i")
		titleEditCancel.className = "editButton fa-solid fa-xmark"
		titleEditCancel.style = "color:red"
		buttonBar.appendChild(titleEditCancel)
		
		newItemContainer.appendChild(buttonBar)
		newItemWrapper.appendChild(newItemContainer)
		this.wrapper.appendChild(newItemWrapper)

		// Event handlers
		const self = this
		const rowButtonBar = buttonBar
		newItem.addEventListener("click", function() {
			self.rootObject.makeEditable(newItem,rowButtonBar)
		})
		titleEditOK.addEventListener("click", function() {
			self.rootObject.makeUnEditable(newItem,rowButtonBar)
			self.rootObject.addRow(newItem.innerText);
			// Refresh the display after the addition has taken effect (might have to bump up time?)
			setTimeout(function() {
				self.rootObject.refreshContents()
			},500);
		})
		titleEditCancel.addEventListener("click", function() {
			self.rootObject.makeUnEditable(newItem,rowButtonBar)
			self.rootObject.refreshContents()
		})
	}
}
