import { useRef } from "react";
import { useDeletePropertyPhoto, usePropertyPhotos, useUploadPropertyPhoto } from "../lib/properties";

export function PropertyPhotos({ propertyId }: { propertyId: number }) {
  const { data: photos } = usePropertyPhotos(propertyId);
  const uploadPhoto = useUploadPropertyPhoto(propertyId);
  const deletePhoto = useDeletePropertyPhoto(propertyId);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadPhoto.mutate(file);
    e.target.value = "";
  }

  return (
    <div className="photo-grid">
      {photos?.map((photo) => (
        <div className="photo-thumb" key={photo.id}>
          <img src={photo.dateipfad} alt={photo.beschriftung ?? "Installationsstelle"} />
          <button type="button" onClick={() => deletePhoto.mutate(photo.id)} aria-label="Foto löschen">
            ×
          </button>
        </div>
      ))}
      <label className="upload-label">
        {uploadPhoto.isPending ? "Lädt hoch…" : "+ Foto"}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
}
