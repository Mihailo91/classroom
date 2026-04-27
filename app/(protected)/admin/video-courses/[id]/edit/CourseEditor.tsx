"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  vimeoId: string;
  durationMinutes: number | null;
  isPreview: boolean;
  order: number;
};

type Module = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: Lesson[];
};

type Course = {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string | null;
  price: any;
  isPublished: boolean;
  modules: Module[];
};

export default function CourseEditor({ course }: { course: Course }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"details" | "content">("details");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Course details form
  const [courseData, setCourseData] = useState({
    title: course.title,
    description: course.description,
    coverImageUrl: course.coverImageUrl || "",
    price: course.price.toString(),
    isPublished: course.isPublished,
  });

  const handleSaveCourseDetails = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update course");
      }

      setSuccess("Course details saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Edit Course: {course.title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage course details, modules, and lessons
          </p>
        </div>
        <Link
          href="/admin/video-courses"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          ← Back to Courses
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("details")}
            className={`${
              activeTab === "details"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Course Details
          </button>
          <button
            onClick={() => setActiveTab("content")}
            className={`${
              activeTab === "content"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Modules & Lessons
          </button>
        </nav>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === "details" ? (
        <CourseDetailsTab
          courseData={courseData}
          setCourseData={setCourseData}
          onSave={handleSaveCourseDetails}
          saving={saving}
        />
      ) : (
        <ModulesLessonsTab course={course} onUpdate={() => router.refresh()} />
      )}
    </div>
  );
}

// Course Details Tab Component
function CourseDetailsTab({
  courseData,
  setCourseData,
  onSave,
  saving,
}: any) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Title *
          </label>
          <input
            type="text"
            value={courseData.title}
            onChange={(e) =>
              setCourseData({ ...courseData, title: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={courseData.description}
            onChange={(e) =>
              setCourseData({ ...courseData, description: e.target.value })
            }
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Cover Image URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Image URL
          </label>
          <input
            type="url"
            value={courseData.coverImageUrl}
            onChange={(e) =>
              setCourseData({ ...courseData, coverImageUrl: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {courseData.coverImageUrl && (
            <img
              src={courseData.coverImageUrl}
              alt="Cover preview"
              className="mt-2 h-32 rounded-lg object-cover"
            />
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price (€) *
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={courseData.price}
            onChange={(e) =>
              setCourseData({ ...courseData, price: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Publish Toggle */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={courseData.isPublished}
              onChange={(e) =>
                setCourseData({ ...courseData, isPublished: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Published</span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Published courses are visible to students
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save Course Details"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modules & Lessons Tab Component
function ModulesLessonsTab({ course, onUpdate }: { course: Course; onUpdate: () => void }) {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [addingModule, setAddingModule] = useState(false);
  const [addingLesson, setAddingLesson] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Add Module Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Course Content ({course.modules.length} modules)
        </h2>
        <button
          onClick={() => setAddingModule(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Module
        </button>
      </div>

      {/* Add Module Form */}
      {addingModule && (
        <AddModuleForm
          courseId={course.id}
          onClose={() => setAddingModule(false)}
          onSuccess={() => {
            setAddingModule(false);
            onUpdate();
          }}
        />
      )}

      {/* Modules List */}
      {course.modules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-5xl mb-4">📖</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No modules yet
          </h3>
          <p className="text-sm text-gray-500">
            Add your first module to start building your course
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {course.modules.map((module, index) => (
            <div key={module.id} className="bg-white rounded-2xl border border-gray-200">
              {/* Module Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-sm text-gray-500 font-medium">
                    #{index + 1}
                  </div>
                  <button
                    onClick={() =>
                      setExpandedModule(expandedModule === module.id ? null : module.id)
                    }
                    className="flex-1 text-left"
                  >
                    <h3 className="text-base font-semibold text-gray-900">
                      {module.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {module.lessons.length} lessons
                    </p>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingModule(module.id)}
                    className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteModule(module.id, onUpdate)}
                    className="text-sm text-red-600 hover:text-red-800 px-3 py-1"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() =>
                      setExpandedModule(expandedModule === module.id ? null : module.id)
                    }
                    className="text-gray-400 hover:text-gray-600 p-2"
                  >
                    {expandedModule === module.id ? "▲" : "▼"}
                  </button>
                </div>
              </div>

              {/* Edit Module Form */}
              {editingModule === module.id && (
                <div className="border-t p-4">
                  <EditModuleForm
                    module={module}
                    onClose={() => setEditingModule(null)}
                    onSuccess={() => {
                      setEditingModule(null);
                      onUpdate();
                    }}
                  />
                </div>
              )}

              {/* Expanded Module - Lessons */}
              {expandedModule === module.id && (
                <div className="border-t bg-gray-50 p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-semibold text-gray-700">Lessons</h4>
                    <button
                      onClick={() => setAddingLesson(module.id)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      + Add Lesson
                    </button>
                  </div>

                  {/* Add Lesson Form */}
                  {addingLesson === module.id && (
                    <div className="mb-4">
                      <AddLessonForm
                        moduleId={module.id}
                        onClose={() => setAddingLesson(null)}
                        onSuccess={() => {
                          setAddingLesson(null);
                          onUpdate();
                        }}
                      />
                    </div>
                  )}

                  {/* Lessons List */}
                  {module.lessons.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No lessons yet. Add your first lesson to this module.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div key={lesson.id}>
                          {editingLesson === lesson.id ? (
                            <EditLessonForm
                              lesson={lesson}
                              onClose={() => setEditingLesson(null)}
                              onSuccess={() => {
                                setEditingLesson(null);
                                onUpdate();
                              }}
                            />
                          ) : (
                            <div className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <span className="text-xs text-gray-400 font-medium">
                                  {lessonIndex + 1}
                                </span>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h5 className="text-sm font-medium text-gray-900">
                                      {lesson.title}
                                    </h5>
                                    {lesson.isPreview && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                        Preview
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Vimeo ID: {lesson.vimeoId}
                                    {lesson.durationMinutes && ` • ${lesson.durationMinutes} min`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setEditingLesson(lesson.id)}
                                  className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteLesson(lesson.id, onUpdate)}
                                  className="text-xs text-red-600 hover:text-red-800 px-2 py-1"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Add Module Form
function AddModuleForm({ courseId, onClose, onSuccess }: any) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/courses/${courseId}/modules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) throw new Error("Failed to create module");
      onSuccess();
    } catch (err) {
      alert("Failed to create module");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50 rounded-xl border border-blue-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Add New Module</h3>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Module title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <textarea
          placeholder="Module description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Module"}
          </button>
        </div>
      </div>
    </form>
  );
}

// Edit Module Form
function EditModuleForm({ module, onClose, onSuccess }: any) {
  const [title, setTitle] = useState(module.title);
  const [description, setDescription] = useState(module.description || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/modules/${module.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });

      if (!response.ok) throw new Error("Failed to update module");
      onSuccess();
    } catch (err) {
      alert("Failed to update module");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Edit Module</h3>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Module title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <textarea
          placeholder="Module description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}

// Add Lesson Form
function AddLessonForm({ moduleId, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    vimeoId: "",
    durationMinutes: "",
    isPreview: false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/modules/${moduleId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to create lesson");
      onSuccess();
    } catch (err) {
      alert("Failed to create lesson");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-green-50 rounded-xl border border-green-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Add New Lesson</h3>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Lesson title *"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <input
          type="text"
          placeholder="Vimeo ID *"
          value={formData.vimeoId}
          onChange={(e) => setFormData({ ...formData, vimeoId: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <input
          type="number"
          placeholder="Duration (minutes)"
          value={formData.durationMinutes}
          onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <textarea
          placeholder="Lesson description (optional)"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isPreview}
            onChange={(e) => setFormData({ ...formData, isPreview: e.target.checked })}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Mark as preview lesson (publicly accessible)</span>
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Lesson"}
          </button>
        </div>
      </div>
    </form>
  );
}

// Edit Lesson Form
function EditLessonForm({ lesson, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    title: lesson.title,
    description: lesson.description || "",
    vimeoId: lesson.vimeoId,
    durationMinutes: lesson.durationMinutes?.toString() || "",
    isPreview: lesson.isPreview,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update lesson");
      onSuccess();
    } catch (err) {
      alert("Failed to update lesson");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Edit Lesson</h3>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Lesson title *"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <input
          type="text"
          placeholder="Vimeo ID *"
          value={formData.vimeoId}
          onChange={(e) => setFormData({ ...formData, vimeoId: e.target.value })}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <input
          type="number"
          placeholder="Duration (minutes)"
          value={formData.durationMinutes}
          onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <textarea
          placeholder="Lesson description (optional)"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isPreview}
            onChange={(e) => setFormData({ ...formData, isPreview: e.target.checked })}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Mark as preview lesson (publicly accessible)</span>
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}

// Delete handlers
async function handleDeleteModule(moduleId: string, onUpdate: () => void) {
  if (!confirm("Are you sure you want to delete this module? All lessons in this module will also be deleted.")) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/modules/${moduleId}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete module");
    onUpdate();
  } catch (err) {
    alert("Failed to delete module");
  }
}

async function handleDeleteLesson(lessonId: string, onUpdate: () => void) {
  if (!confirm("Are you sure you want to delete this lesson?")) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/lessons/${lessonId}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete lesson");
    onUpdate();
  } catch (err) {
    alert("Failed to delete lesson");
  }
}
