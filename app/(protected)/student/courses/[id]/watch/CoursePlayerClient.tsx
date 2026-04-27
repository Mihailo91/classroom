"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  vimeoId: string | null;
  durationMinutes: number | null;
  isPreview: boolean;
  order: number;
};

type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
};

type Course = {
  id: string;
  title: string;
  modules: Module[];
};

export default function CoursePlayerClient({
  course,
  owned,
  activeLessonId,
}: {
  course: Course;
  owned: boolean;
  activeLessonId: string;
}) {
  const router = useRouter();
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const [activeId, setActiveId] = useState(activeLessonId);

  // Sync activeId with activeLessonId prop when URL changes
  useEffect(() => {
    setActiveId(activeLessonId);
  }, [activeLessonId]);

  const activeLesson = allLessons.find((l) => l.id === activeId) ?? allLessons[0];
  const activeIndex = allLessons.findIndex((l) => l.id === activeId);
  const prevLesson = activeIndex > 0 ? allLessons[activeIndex - 1] : null;
  const nextLesson = activeIndex < allLessons.length - 1 ? allLessons[activeIndex + 1] : null;

  // Extract Vimeo ID from URL if needed (supports both "123456" and "https://vimeo.com/123456")
  const extractVimeoId = (vimeoId: string | null): string | null => {
    if (!vimeoId) return null;
    const match = vimeoId.match(/(?:vimeo\.com\/)?(\d+)/);
    return match ? match[1] : vimeoId;
  };

  const handleSelectLesson = (lesson: Lesson) => {
    if (!lesson.vimeoId) return; // locked lesson
    setActiveId(lesson.id);
    router.replace(`/student/courses/${course.id}/watch?lesson=${lesson.id}`, {
      scroll: false,
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-gray-950 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/student/courses/${course.id}`}
            className="text-gray-400 hover:text-white transition-colors shrink-0"
          >
            ←
          </Link>
          <h1 className="text-sm font-semibold text-white truncate">{course.title}</h1>
        </div>
        {!owned && (
          <Link
            href={`/student/courses/${course.id}`}
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shrink-0"
          >
            Buy Full Course
          </Link>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar: Lesson Navigation */}
        <aside className="w-72 shrink-0 bg-gray-800 overflow-y-auto hidden md:block">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Course Content
            </h2>
          </div>

          {course.modules.map((module, mIdx) => (
            <div key={module.id}>
              {/* Module Header */}
              <div className="px-4 py-3 bg-gray-750 border-b border-gray-700">
                <p className="text-xs text-gray-500 mb-0.5">Module {mIdx + 1}</p>
                <p className="text-sm font-medium text-gray-200">{module.title}</p>
              </div>

              {/* Lessons */}
              {module.lessons.map((lesson, lIdx) => {
                const isActive = lesson.id === activeId;
                const isLocked = !lesson.vimeoId;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => handleSelectLesson(lesson)}
                    disabled={isLocked}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-gray-700/50 transition-colors
                      ${isActive ? "bg-blue-700/40 border-l-2 border-l-blue-400" : ""}
                      ${isLocked ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-700/60 cursor-pointer"}
                    `}
                  >
                    <span className="text-xs text-gray-500 mt-0.5 w-4 shrink-0">
                      {lIdx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-snug ${isActive ? "text-white font-semibold" : "text-gray-300"}`}>
                        {lesson.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {lesson.isPreview && !owned && (
                          <span className="text-[10px] text-green-400">Preview</span>
                        )}
                        {isLocked && (
                          <span className="text-[10px] text-gray-500">🔒 Locked</span>
                        )}
                        {lesson.durationMinutes && (
                          <span className="text-[10px] text-gray-500">
                            {lesson.durationMinutes}m
                          </span>
                        )}
                      </div>
                    </div>
                    {isActive && (
                      <span className="text-blue-400 shrink-0 mt-0.5">▶</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        {/* Main: Video Player */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Video Area */}
          <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
            {activeLesson.vimeoId ? (
              <div className="w-full h-full">
                <iframe
                  key={activeLesson.vimeoId}
                  src={`https://player.vimeo.com/video/${extractVimeoId(activeLesson.vimeoId)}?autoplay=1&title=0&byline=0&portrait=0`}
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="text-center p-12">
                <div className="text-6xl mb-4">🔒</div>
                <p className="text-gray-400 mb-6">
                  This lesson is not available in preview mode
                </p>
                <Link
                  href={`/student/courses/${course.id}`}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Buy Full Course
                </Link>
              </div>
            )}
          </div>

          {/* Lesson Info + Navigation */}
          <div className="bg-gray-900 border-t border-gray-700 px-6 py-4 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-white truncate">
                  {activeLesson.title}
                </h2>
                {activeLesson.durationMinutes && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {activeLesson.durationMinutes} min
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-4">
                <button
                  onClick={() => prevLesson && handleSelectLesson(prevLesson)}
                  disabled={!prevLesson || !prevLesson.vimeoId}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                <span className="text-xs text-gray-500">
                  {activeIndex + 1} / {allLessons.filter((l) => l.vimeoId).length}
                </span>
                <button
                  onClick={() => nextLesson && handleSelectLesson(nextLesson)}
                  disabled={!nextLesson || !nextLesson.vimeoId}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Transcript */}
            {activeLesson.description && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Transcript</h3>
                <div className="max-h-32 overflow-y-auto">
                  <p className="text-sm text-gray-400 whitespace-pre-wrap leading-relaxed">
                    {activeLesson.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
