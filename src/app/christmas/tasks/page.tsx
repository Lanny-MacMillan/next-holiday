"use client";

import { useState } from "react";
import Link from "next/link";

export default function TasksPage() {
	const [tasks, setTasks] = useState([
		{ id: 1, text: "Buy wrapping paper", done: false },
		{ id: 2, text: "Decorate tree", done: true },
	]);
	const [newTask, setNewTask] = useState("");

	function addTask(text: string) {
		setTasks((prev) => [{ id: Date.now(), text, done: false }, ...prev]);
		setNewTask("");
	}

	function toggleTask(id: number) {
		setTasks((prev) =>
			prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
		);
	}

	const incomplete = tasks.filter((t) => !t.done);
	const complete = tasks.filter((t) => t.done);

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6 flex flex-col items-center">
				<h1 className="text-2xl font-bold mb-2 text-gray-900">
					Holiday To-Do List
				</h1>
				<Link
					href="/christmas"
					className="text-blue-500 text-sm hover:underline mb-2"
				>
					← Back
				</Link>
			</header>
			<main className="w-full max-w-md flex flex-col gap-6">
				<form
					className="flex gap-2 mb-2"
					onSubmit={(e) => {
						e.preventDefault();
						if (newTask.trim()) addTask(newTask.trim());
					}}
				>
					<input
						className="flex-1 border rounded px-3 py-2 text-gray-900 placeholder-gray-700"
						placeholder="Add a new task..."
						value={newTask}
						onChange={(e) => setNewTask(e.target.value)}
					/>
					<button
						type="submit"
						className="bg-blue-500 text-white px-4 py-2 rounded"
					>
						Add
					</button>
				</form>
				<div>
					<h2 className="font-semibold text-gray-900 mb-2">Incomplete</h2>
					<ul className="divide-y bg-white rounded shadow">
						{incomplete.length === 0 && (
							<li className="px-4 py-3 text-gray-400">All done!</li>
						)}
						{incomplete.map((task) => (
							<li
								key={task.id}
								className="flex items-center px-4 py-3 cursor-pointer hover:bg-blue-50"
								onClick={() => toggleTask(task.id)}
							>
								<input
									type="checkbox"
									checked={task.done}
									readOnly
									className="mr-3 accent-blue-500"
								/>
								<span className="text-gray-900">{task.text}</span>
							</li>
						))}
					</ul>
				</div>
				<div>
					<h2 className="font-semibold text-gray-400 mb-2">Completed</h2>
					<ul className="divide-y bg-white rounded shadow">
						{complete.length === 0 && (
							<li className="px-4 py-3 text-gray-300">
								No completed tasks yet.
							</li>
						)}
						{complete.map((task) => (
							<li
								key={task.id}
								className="flex items-center px-4 py-3 cursor-pointer hover:bg-blue-50 opacity-60"
								onClick={() => toggleTask(task.id)}
							>
								<input
									type="checkbox"
									checked={task.done}
									readOnly
									className="mr-3 accent-blue-500"
								/>
								<span className="line-through text-gray-400">{task.text}</span>
							</li>
						))}
					</ul>
				</div>
			</main>
		</div>
	);
}
