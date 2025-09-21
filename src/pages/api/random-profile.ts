import type { APIRoute } from "astro"
import { db, GuesserProfile } from "astro:db"

export const GET: APIRoute = async () => {
	const allProfiles = await db.select().from(GuesserProfile)
	const randomRow =
		allProfiles[Math.floor(Math.random() * allProfiles.length)]

	return new Response(JSON.stringify(randomRow), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	})
}
