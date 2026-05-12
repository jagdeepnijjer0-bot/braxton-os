import EventForm from "@/app/components/calendar/EventForm";
import Link from "next/link";

interface Props { searchParams: Promise<{ date?: string }> }

export default async function NewEventPage({ searchParams }: Props) {
  const { date } = await searchParams;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/calendar" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 mb-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Calendar
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Event</h1>
        <p className="text-sm text-gray-500 mt-1">
          {date ? `Scheduling for ${new Date(date + "T12:00").toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}` : "Add an event to your calendar."}
        </p>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <EventForm defaultDate={date} />
      </div>
    </div>
  );
}
