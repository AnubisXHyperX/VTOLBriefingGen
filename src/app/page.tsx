import Planner from "@/components/planner";

export default function Home() {
  return (
    <div className="bg-slate-800 rounded-lg m-24 min-h-screen border-amber-400 border-2 shadow-xl shadow-amber-400">
      <div className="p-10 flex justify-center">
        <h1 className="text-amber-400 text-8xl">VTOL VR Flight Planner</h1>
      </div>
      <hr className="w-full border-t-2 border-amber-400 mt-4 shadow-xl shadow-amber-400" />
      <Planner />
    </div>
  );
}
