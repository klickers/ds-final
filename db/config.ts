import { defineDb, defineTable, column } from "astro:db"

const UserProfile = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		age: column.number(),
		q35: column.text(),
		q63114: column.text(),
	},
})

// profiles for guessing
const GuesserProfile = defineTable({
	columns: {
		id: column.number({ primaryKey: true }),
		row_index: column.number(),
		q35: column.text(),
		q358077: column.text(),
		q179268: column.text(),
		q41: column.text(),
		q44639: column.text(),
		q41953: column.text(),
		q35660: column.text(),
		gender: column.text(),
		gender2: column.text(),
		d_religion_type: column.text({ optional: true }),
		d_drugs: column.text(),
		q20930: column.text(),
		q16053: column.text(),
		lf_want: column.text(),
		q9688: column.text(),
		d_age: column.number(),
		enhanced_predicted_age: column.number({ optional: true }),
		llm_predicted_age: column.number({ optional: true }),
		llm_predicted_explanation: column.text({ optional: true }),
	},
})

export default defineDb({
	tables: { UserProfile, GuesserProfile },
})
