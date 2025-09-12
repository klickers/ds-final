import { defineDb, defineTable, column } from "astro:db"

const UserProfile = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		age: column.number(),
		q35: column.text(),
		q63114: column.text(),
	},
})

export default defineDb({
	tables: { UserProfile },
})
