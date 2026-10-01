"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function NewProjectPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    if (!slug) {
      setError("Project name is required.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("projects")
      .insert({
        owner_id: user.id,
        name: name.trim(),
        slug,
        description: description.trim() || null,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        setError(
          "A project with this name already exists.",
        );
      } else {
        setError(error.message);
      }

      setLoading(false);
      return;
    }

    router.push(`/projects/${data.id}`);
    router.refresh();
  }

  return (
    <div className="vp-page" style={{ maxWidth: 640 }}>
      <nav className="vp-breadcrumb" aria-label="Breadcrumb">
        <span>Dashboard</span>
        <span aria-hidden="true">/</span>
        <span aria-current="page">New project</span>
      </nav>

      <header className="vp-page-header">
        <div>
          <p className="vp-eyebrow">New Project</p>
          <h1 className="vp-page-title">Create Project</h1>
          <p className="vp-page-desc">
            Start by describing what you want to build. Discovery will guide
            the rest of the pipeline.
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Project name</label>
          <input
            id="name"
            type="text"
            className="input"
            placeholder="School Management System"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            required
            maxLength={100}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">What do you want to build?</label>
          <textarea
            id="description"
            className="textarea"
            placeholder="A web application for managing students, teachers, classes, and school activities."
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            maxLength={2000}
            rows={6}
          />
        </div>

        {error && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div className="ws-actions">
          <button
            type="submit"
            className={`btn btn-primary${loading ? " is-loading" : ""}`}
            disabled={loading}
          >
            {loading
              ? "Creating..."
              : "Create project"}
          </button>
        </div>
      </form>
    </div>
  );
}