"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function signIn(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toString(),
      password: password.toString(),
    })

    if (error) {
      return { error: error.message }
    }

    // Return success instead of redirecting directly
    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Sign up action with user profile creation
export async function signUp(prevState: any, formData: FormData) {
  if (!formData) {
    return { error: "Form data is missing" }
  }

  const email = formData.get("email")
  const password = formData.get("password")
  const fullName = formData.get("fullName")
  const role = formData.get("role")
  const studentId = formData.get("studentId")
  const staffId = formData.get("staffId")
  const department = formData.get("department")
  const yearOfStudy = formData.get("yearOfStudy")

  if (!email || !password || !fullName || !role) {
    return { error: "All required fields must be filled" }
  }

  const supabase = createClient()

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toString(),
      password: password.toString(),
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/dashboard`,
      },
    })

    if (authError) {
      return { error: authError.message }
    }

    if (authData.user) {
      try {
        const { error: profileError } = await supabase.from("users").insert({
          id: authData.user.id,
          email: email.toString(),
          full_name: fullName.toString(),
          role: role.toString(),
          student_id: role === "student" ? studentId?.toString() : null,
          staff_id: role !== "student" ? staffId?.toString() : null,
          department: department?.toString(),
          year_of_study: role === "student" && yearOfStudy ? Number.parseInt(yearOfStudy.toString()) : null,
        })

        if (profileError) {
          console.error("Profile creation error:", profileError)
          // Don't fail registration if profile creation fails - user can still authenticate
          console.log(
            "[v0] Profile creation failed, but user auth was successful. Database tables may not be created yet.",
          )
        }
      } catch (profileError) {
        console.error("Profile creation error:", profileError)
        // Don't fail registration if profile creation fails
        console.log(
          "[v0] Profile creation failed, but user auth was successful. Database tables may not be created yet.",
        )
      }
    }

    return { success: "Account created successfully! Check your email to confirm your account." }
  } catch (error) {
    console.error("Sign up error:", error)
    return { error: "An unexpected error occurred. Please try again." }
  }
}

// Sign out action
export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}

// Action to track resource downloads
export async function trackDownload(resourceId: string) {
  "use server"
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to download resources." }
  }

  try {
    const { error } = await supabase.from("resource_downloads").insert({
      resource_id: resourceId,
      user_id: user.id,
    })

    if (error) {
      // This might fail if the user has already downloaded the resource, which is fine.
      console.warn("Error tracking download:", error.message)
    }
  } catch (error) {
    console.error("Error tracking download:", error)
  }
}

// Action to upload a learning resource
export async function uploadResource(formData: FormData) {
  "use server"

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to upload resources." }
  }

  const unitId = formData.get("unitId") as string
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const file = formData.get("file") as File

  if (!unitId || !title || !file) {
    return { error: "Missing required fields." }
  }

  try {
    // 1. Upload file to Supabase Storage
    const filePath = `${unitId}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from("learning_resources").upload(filePath, file)

    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      return { error: "Failed to upload file." }
    }

    // 2. Get public URL of the uploaded file
    const { data: urlData } = supabase.storage.from("learning_resources").getPublicUrl(filePath)
    const fileUrl = urlData.publicUrl

    // 3. Insert into learning_resources table
    const { error: insertError } = await supabase.from("learning_resources").insert({
      unit_id: unitId,
      title,
      description,
      resource_type: file.type.startsWith("video") ? "video" : "document", // Simple type detection
      file_url: fileUrl,
      file_size: file.size,
      uploaded_by: user.id,
    })

    if (insertError) {
      console.error("Error inserting resource:", insertError)
      return { error: "Failed to save resource to database." }
    }

    // Revalidate the path to show the new resource
    revalidatePath(`/dashboard/units/${unitId}/resources`)

    return { success: true }
  } catch (error) {
    console.error("Error uploading resource:", error)
    return { error: "An unexpected error occurred." }
  }
}
