const CLOUDINARY_CLOUD_NAME = "dc2ytjcne";
const CLOUDINARY_UPLOAD_PRESET = "iconx_image";

export const uploadImageToCloudinary = async (file) => {
  if (!file) throw new Error("No file selected");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "products");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || "Image upload failed");
  }

  return data.secure_url;
};