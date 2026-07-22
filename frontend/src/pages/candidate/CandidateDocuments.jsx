import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  File,
  FileArchive,
  FileImage,
  FileText,
  FolderOpen,
  LoaderCircle,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance.js";
import "./CandidateDocuments.css";

const DOCUMENT_TYPES = [
  "Certificate",
  "Degree Transcript",
  "Portfolio",
  "Cover Letter",
  "Other",
];

const MAXIMUM_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".jpg",
  ".jpeg",
  ".png",
];

function CandidateDocuments() {
  const fileInputReference = useRef(null);

  const [documents, setDocuments] = useState([]);

  const [documentType, setDocumentType] =
    useState("Certificate");

  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.get(
        "/CandidateDocuments/my"
      );

      const responseDocuments = Array.isArray(response.data)
        ? response.data
        : response.data?.documents ?? [];

      setDocuments(responseDocuments);
    } catch (error) {
      console.error(
        "Candidate document loading error:",
        error
      );

      setIsError(true);
      setMessage(
        error.response?.data?.message ??
          "Unable to load your documents."
      );
    } finally {
      setLoading(false);
    }
  };

  const totalFileSize = useMemo(
    () =>
      documents.reduce(
        (total, document) =>
          total + Number(document.fileSize ?? 0),
        0
      ),
    [documents]
  );

  const validateFile = (file) => {
    if (!file) {
      return "Please select a document.";
    }

    const lowerCaseFileName = file.name.toLowerCase();

    const isValidExtension = ALLOWED_EXTENSIONS.some(
      (extension) =>
        lowerCaseFileName.endsWith(extension)
    );

    if (!isValidExtension) {
      return "Only PDF, DOC, DOCX, JPG, JPEG and PNG files are allowed.";
    }

    if (file.size > MAXIMUM_FILE_SIZE) {
      return "The selected file must not exceed 5 MB.";
    }

    return "";
  };

  const handleFileSelection = (event) => {
    const file = event.target.files?.[0] ?? null;

    setMessage("");
    setIsError(false);

    const validationMessage = validateFile(file);

    if (validationMessage) {
      setSelectedFile(null);
      setIsError(true);
      setMessage(validationMessage);

      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);

    if (fileInputReference.current) {
      fileInputReference.current.value = "";
    }
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    const validationMessage =
      validateFile(selectedFile);

    if (validationMessage) {
      setIsError(true);
      setMessage(validationMessage);
      return;
    }

    if (!DOCUMENT_TYPES.includes(documentType)) {
      setIsError(true);
      setMessage("Please select a valid document type.");
      return;
    }

    setUploading(true);
    setMessage("");
    setIsError(false);

    try {
      const formData = new FormData();

      formData.append("DocumentType", documentType);
      formData.append("Description", description.trim());
      formData.append("File", selectedFile);

      const response = await axiosInstance.post(
        "/CandidateDocuments/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage(
        response.data?.message ??
          "Document uploaded successfully."
      );

      setDescription("");
      setSelectedFile(null);

      if (fileInputReference.current) {
        fileInputReference.current.value = "";
      }

      await loadDocuments();
    } catch (error) {
      console.error(
        "Candidate document upload error:",
        error
      );

      setIsError(true);
      setMessage(
        error.response?.data?.message ??
          "Unable to upload the document."
      );
    } finally {
      setUploading(false);
    }
  };

  const downloadDocument = async (document) => {
    setProcessingId(document.candidateDocumentId);
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.get(
        `/CandidateDocuments/${document.candidateDocumentId}/download`,
        {
          responseType: "blob",
        }
      );

      const contentType =
        response.headers["content-type"] ??
        document.contentType ??
        "application/octet-stream";

      const fileBlob = new Blob([response.data], {
        type: contentType,
      });

      const downloadUrl =
        window.URL.createObjectURL(fileBlob);

      const downloadLink =
        window.document.createElement("a");

      downloadLink.href = downloadUrl;
      downloadLink.download =
        document.originalFileName ?? "document";

      window.document.body.appendChild(downloadLink);

      downloadLink.click();
      downloadLink.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error(
        "Candidate document download error:",
        error
      );

      setIsError(true);
      setMessage("Unable to download the document.");
    } finally {
      setProcessingId(null);
    }
  };

  const deleteDocument = async (document) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${document.originalFileName}"?`
    );

    if (!confirmed) {
      return;
    }

    setProcessingId(document.candidateDocumentId);
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.delete(
        `/CandidateDocuments/${document.candidateDocumentId}`
      );

      setDocuments((currentDocuments) =>
        currentDocuments.filter(
          (item) =>
            item.candidateDocumentId !==
            document.candidateDocumentId
        )
      );

      setMessage(
        response.data?.message ??
          "Document deleted successfully."
      );
    } catch (error) {
      console.error(
        "Candidate document delete error:",
        error
      );

      setIsError(true);
      setMessage(
        error.response?.data?.message ??
          "Unable to delete the document."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const formatFileSize = (fileSize) => {
    const size = Number(fileSize ?? 0);

    if (size === 0) {
      return "0 KB";
    }

    if (size < 1024) {
      return `${size} bytes`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Date unavailable";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getDocumentIcon = (document) => {
    const fileName =
      document.originalFileName?.toLowerCase() ?? "";

    if (
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".png")
    ) {
      return FileImage;
    }

    if (
      fileName.endsWith(".doc") ||
      fileName.endsWith(".docx")
    ) {
      return FileText;
    }

    if (fileName.endsWith(".pdf")) {
      return FileArchive;
    }

    return File;
  };

  return (
    <div className="candidate-documents-page">
      <section className="candidate-documents-heading">
        <div>
          <span className="candidate-documents-eyebrow">
            Candidate document centre
          </span>

          <h2>Documents and Certifications</h2>

          <p>
            Securely upload and manage certificates,
            transcripts, portfolios, cover letters and other
            supporting files.
          </p>
        </div>

        <div className="candidate-documents-security">
          <ShieldCheck size={21} />

          <div>
            <strong>Secure storage</strong>
            <span>Protected candidate documents</span>
          </div>
        </div>
      </section>

      {message && (
        <div
          className={`candidate-documents-message ${
            isError
              ? "candidate-documents-message-error"
              : "candidate-documents-message-success"
          }`}
          role="alert"
        >
          {isError ? (
            <AlertCircle size={20} />
          ) : (
            <CheckCircle2 size={20} />
          )}

          <span>{message}</span>

          <button
            type="button"
            aria-label="Close message"
            onClick={() => setMessage("")}
          >
            ×
          </button>
        </div>
      )}

      <section className="candidate-documents-statistics">
        <article>
          <div className="candidate-documents-stat-icon">
            <FolderOpen size={22} />
          </div>

          <div>
            <span>Total documents</span>
            <strong>{documents.length}</strong>
          </div>
        </article>

        <article>
          <div className="candidate-documents-stat-icon">
            <FileText size={22} />
          </div>

          <div>
            <span>Certificates</span>
            <strong>
              {
                documents.filter(
                  (document) =>
                    document.documentType === "Certificate"
                ).length
              }
            </strong>
          </div>
        </article>

        <article>
          <div className="candidate-documents-stat-icon">
            <FileArchive size={22} />
          </div>

          <div>
            <span>Storage used</span>
            <strong>{formatFileSize(totalFileSize)}</strong>
          </div>
        </article>
      </section>

      <div className="candidate-documents-layout">
        <section className="candidate-documents-upload-card">
          <div className="candidate-documents-card-heading">
            <div className="candidate-documents-card-icon">
              <UploadCloud size={23} />
            </div>

            <div>
              <h3>Upload a document</h3>
              <p>
                Add professional evidence to your candidate
                profile.
              </p>
            </div>
          </div>

          <form
            className="candidate-documents-form"
            onSubmit={handleUpload}
          >
            <div className="candidate-documents-field">
              <label htmlFor="candidateDocumentType">
                Document type
              </label>

              <select
                id="candidateDocumentType"
                value={documentType}
                onChange={(event) =>
                  setDocumentType(event.target.value)
                }
                disabled={uploading}
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="candidate-documents-field">
              <label htmlFor="candidateDocumentDescription">
                Description
                <span>Optional</span>
              </label>

              <textarea
                id="candidateDocumentDescription"
                value={description}
                maxLength={500}
                placeholder="For example: Python professional certificate completed in 2026."
                disabled={uploading}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
              />

              <small>
                {description.length}/500 characters
              </small>
            </div>

            <div className="candidate-documents-field">
              <label>Choose file</label>

              <label
                htmlFor="candidateDocumentFile"
                className={`candidate-documents-drop-area ${
                  selectedFile
                    ? "candidate-documents-drop-area-selected"
                    : ""
                }`}
              >
                <input
                  ref={fileInputReference}
                  id="candidateDocumentFile"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  disabled={uploading}
                  onChange={handleFileSelection}
                />

                <div className="candidate-documents-upload-icon">
                  <UploadCloud size={27} />
                </div>

                {selectedFile ? (
                  <>
                    <strong>{selectedFile.name}</strong>

                    <span>
                      {formatFileSize(selectedFile.size)}
                    </span>
                  </>
                ) : (
                  <>
                    <strong>
                      Click to select a document
                    </strong>

                    <span>
                      PDF, DOC, DOCX, JPG or PNG — maximum
                      5 MB
                    </span>
                  </>
                )}
              </label>

              {selectedFile && (
                <button
                  type="button"
                  className="candidate-documents-remove-file"
                  disabled={uploading}
                  onClick={removeSelectedFile}
                >
                  Remove selected file
                </button>
              )}
            </div>

            <button
              type="submit"
              className="candidate-documents-upload-button"
              disabled={uploading || !selectedFile}
            >
              {uploading ? (
                <>
                  <LoaderCircle
                    className="candidate-documents-spinner"
                    size={19}
                  />
                  Uploading document...
                </>
              ) : (
                <>
                  <UploadCloud size={19} />
                  Upload document
                </>
              )}
            </button>
          </form>
        </section>

        <section className="candidate-documents-list-card">
          <div className="candidate-documents-list-heading">
            <div>
              <h3>Uploaded documents</h3>

              <p>
                Download or remove your supporting files.
              </p>
            </div>

            <span>
              {documents.length}{" "}
              {documents.length === 1
                ? "document"
                : "documents"}
            </span>
          </div>

          {loading ? (
            <div className="candidate-documents-state">
              <LoaderCircle
                className="candidate-documents-spinner"
                size={30}
              />

              <strong>Loading your documents</strong>

              <p>Please wait a moment.</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="candidate-documents-state">
              <div className="candidate-documents-empty-icon">
                <FolderOpen size={31} />
              </div>

              <strong>No documents uploaded yet</strong>

              <p>
                Upload a certificate, transcript, portfolio or
                supporting document using the form.
              </p>
            </div>
          ) : (
            <div className="candidate-documents-list">
              {documents.map((document) => {
                const DocumentIcon =
                  getDocumentIcon(document);

                const isProcessing =
                  processingId ===
                  document.candidateDocumentId;

                return (
                  <article
                    key={document.candidateDocumentId}
                    className="candidate-document-item"
                  >
                    <div className="candidate-document-file-icon">
                      <DocumentIcon size={24} />
                    </div>

                    <div className="candidate-document-information">
                      <div className="candidate-document-name-row">
                        <h4>
                          {document.originalFileName ??
                            "Candidate document"}
                        </h4>

                        <span>
                          {document.documentType ?? "Other"}
                        </span>
                      </div>

                      {document.description && (
                        <p>{document.description}</p>
                      )}

                      <div className="candidate-document-meta">
                        <span>
                          {formatFileSize(document.fileSize)}
                        </span>

                        <span aria-hidden="true">•</span>

                        <span>
                          {formatDate(document.uploadedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="candidate-document-actions">
                      <button
                        type="button"
                        className="candidate-document-download-button"
                        title="Download document"
                        disabled={isProcessing}
                        onClick={() =>
                          downloadDocument(document)
                        }
                      >
                        {isProcessing ? (
                          <LoaderCircle
                            className="candidate-documents-spinner"
                            size={18}
                          />
                        ) : (
                          <Download size={18} />
                        )}

                        <span>Download</span>
                      </button>

                      <button
                        type="button"
                        className="candidate-document-delete-button"
                        title="Delete document"
                        disabled={isProcessing}
                        onClick={() =>
                          deleteDocument(document)
                        }
                      >
                        <Trash2 size={18} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default CandidateDocuments;