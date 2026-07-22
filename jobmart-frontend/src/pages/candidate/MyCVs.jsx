import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../api/axiosInstance.js";
import "./MyCVs.css";

function MyCVs() {
  const [resumes, setResumes] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isPrimary, setIsPrimary] = useState(true);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.get("/Resumes/my");
      setResumes(response.data ?? []);
    } catch (error) {
      console.error("Resume loading error:", error);

      setIsError(true);
      setMessage(
        error.response?.data?.message ??
          "Unable to load your CVs."
      );
    } finally {
      setLoading(false);
    }
  };

  const primaryResume = useMemo(
    () => resumes.find((resume) => resume.isPrimary),
    [resumes]
  );

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null;

    setMessage("");
    setIsError(false);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const allowedExtensions = [".pdf", ".doc", ".docx"];
    const fileName = file.name.toLowerCase();

    const validExtension = allowedExtensions.some((extension) =>
      fileName.endsWith(extension)
    );

    if (!validExtension) {
      setSelectedFile(null);
      setIsError(true);
      setMessage("Only PDF, DOC and DOCX files are allowed.");
      event.target.value = "";
      return;
    }

    const maximumSize = 5 * 1024 * 1024;

    if (file.size > maximumSize) {
      setSelectedFile(null);
      setIsError(true);
      setMessage("The maximum allowed file size is 5 MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setIsError(true);
      setMessage("Please select a CV file.");
      return;
    }

    setUploading(true);
    setMessage("");
    setIsError(false);

    try {
      const formData = new FormData();

      formData.append("File", selectedFile);
      formData.append("IsPrimary", isPrimary);

      const response = await axiosInstance.post(
        "/Resumes/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage(
        response.data?.message ??
          "CV uploaded successfully."
      );

      setSelectedFile(null);
      setIsPrimary(false);

      const fileInput =
        document.getElementById("resumeFile");

      if (fileInput) {
        fileInput.value = "";
      }

      await loadResumes();
    } catch (error) {
      console.error("Resume upload error:", error);

      setIsError(true);
      setMessage(
        error.response?.data?.message ??
          "Unable to upload the CV."
      );
    } finally {
      setUploading(false);
    }
  };

  const setPrimaryResume = async (resumeId) => {
    setProcessingId(resumeId);
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.put(
        `/Resumes/${resumeId}/primary`
      );

      setResumes((previousResumes) =>
        previousResumes.map((resume) => ({
          ...resume,
          isPrimary: resume.resumeId === resumeId,
        }))
      );

      setMessage(
        response.data?.message ??
          "Primary CV updated successfully."
      );
    } catch (error) {
      console.error("Set primary CV error:", error);

      setIsError(true);
      setMessage(
        error.response?.data?.message ??
          "Unable to update the primary CV."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const downloadResume = async (resume) => {
    setProcessingId(resume.resumeId);
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.get(
        `/Resumes/${resume.resumeId}/download`,
        {
          responseType: "blob",
        }
      );

      const fileUrl = window.URL.createObjectURL(
        new Blob([response.data])
      );

      const downloadLink = document.createElement("a");

      downloadLink.href = fileUrl;
      downloadLink.download =
        resume.originalFileName ?? "resume";

      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      window.URL.revokeObjectURL(fileUrl);
    } catch (error) {
      console.error("Resume download error:", error);

      setIsError(true);
      setMessage("Unable to download the CV.");
    } finally {
      setProcessingId(null);
    }
  };

  const deleteResume = async (resume) => {
    const confirmed = window.confirm(
      `Delete "${resume.originalFileName}"?`
    );

    if (!confirmed) {
      return;
    }

    setProcessingId(resume.resumeId);
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.delete(
        `/Resumes/${resume.resumeId}`
      );

      setResumes((previousResumes) =>
        previousResumes.filter(
          (item) => item.resumeId !== resume.resumeId
        )
      );

      setMessage(
        response.data?.message ??
          "CV deleted successfully."
      );
    } catch (error) {
      console.error("Resume delete error:", error);

      setIsError(true);
      setMessage(
        error.response?.data?.message ??
          "Unable to delete the CV."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const formatFileSize = (fileSize) => {
    if (!fileSize) {
      return "0 KB";
    }

    if (fileSize < 1024 * 1024) {
      return `${(fileSize / 1024).toFixed(1)} KB`;
    }

    return `${(fileSize / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Date unavailable";
    }

    return new Date(dateValue).toLocaleString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="cvs-state-card">
        <h2>Loading CVs...</h2>
        <p>Please wait while your uploaded CVs are loaded.</p>
      </div>
    );
  }

  return (
    <div className="my-cvs-page">
      <section className="cvs-header">
        <div>
          <span className="cvs-label">
            Candidate Documents
          </span>

          <h2>My CVs</h2>

          <p>
            Upload and manage the CVs used for your job
            applications.
          </p>
        </div>

        <div className="cvs-summary">
          <div>
            <strong>{resumes.length}</strong>
            <span>Total CVs</span>
          </div>

          <div>
            <strong>{primaryResume ? "1" : "0"}</strong>
            <span>Primary CV</span>
          </div>
        </div>
      </section>

      {message && (
        <div
          className={
            isError
              ? "cvs-message error"
              : "cvs-message success"
          }
        >
          {message}
        </div>
      )}

      <section className="cv-upload-card">
        <div className="cv-upload-heading">
          <div>
            <h3>Upload a New CV</h3>
            <p>
              Accepted formats: PDF, DOC and DOCX. Maximum size:
              5 MB.
            </p>
          </div>
        </div>

        <form
          className="cv-upload-form"
          onSubmit={handleUpload}
        >
          <div className="cv-file-input-group">
            <label htmlFor="resumeFile">
              Select CV file
            </label>

            <input
              id="resumeFile"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
            />

            {selectedFile && (
              <p className="selected-file-information">
                Selected: {selectedFile.name} (
                {formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>

          <label className="primary-checkbox">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(event) =>
                setIsPrimary(event.target.checked)
              }
            />

            <span>Set this CV as my primary CV</span>
          </label>

          <button
            type="submit"
            className="cv-upload-button"
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload CV"}
          </button>
        </form>
      </section>

      <section className="cv-list-section">
        <div className="cv-list-heading">
          <div>
            <h3>Uploaded CVs</h3>
            <p>
              Download, delete or select your primary CV.
            </p>
          </div>

          <button
            type="button"
            className="cv-refresh-button"
            onClick={loadResumes}
          >
            Refresh
          </button>
        </div>

        {resumes.length === 0 ? (
          <div className="cvs-state-card">
            <h3>No CVs uploaded</h3>
            <p>Upload your first CV using the form above.</p>
          </div>
        ) : (
          <div className="cv-list">
            {resumes.map((resume) => (
              <article
                key={resume.resumeId}
                className={
                  resume.isPrimary
                    ? "cv-card primary"
                    : "cv-card"
                }
              >
                <div className="cv-file-icon">
                  {resume.originalFileName
                    ?.split(".")
                    .pop()
                    ?.toUpperCase() ?? "CV"}
                </div>

                <div className="cv-file-details">
                  <div className="cv-title-row">
                    <h4>{resume.originalFileName}</h4>

                    {resume.isPrimary && (
                      <span className="primary-cv-badge">
                        Primary
                      </span>
                    )}
                  </div>

                  <div className="cv-metadata">
                    <span>
                      {formatFileSize(resume.fileSize)}
                    </span>

                    <span>
                      Uploaded {formatDate(resume.uploadedAt)}
                    </span>
                  </div>
                </div>

                <div className="cv-card-actions">
                  <button
                    type="button"
                    className="cv-download-button"
                    disabled={
                      processingId === resume.resumeId
                    }
                    onClick={() => downloadResume(resume)}
                  >
                    Download
                  </button>

                  {!resume.isPrimary && (
                    <button
                      type="button"
                      className="cv-primary-button"
                      disabled={
                        processingId === resume.resumeId
                      }
                      onClick={() =>
                        setPrimaryResume(resume.resumeId)
                      }
                    >
                      Set Primary
                    </button>
                  )}

                  <button
                    type="button"
                    className="cv-delete-button"
                    disabled={
                      processingId === resume.resumeId
                    }
                    onClick={() => deleteResume(resume)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default MyCVs;