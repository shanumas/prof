"use client";
import React, { useState, useEffect, useRef } from "react";
import { DocumentChunk, Document, DocumentPayload } from "../Document/types";
import ReactMarkdown from "react-markdown";
import PulseLoader from "react-spinners/PulseLoader";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/cjs/styles/prism";
import { SettingsConfiguration } from "../Settings/types";
import { FormattedDocument } from "../Document/types";
import { splitDocument } from "./util";
import { FaExternalLinkAlt } from "react-icons/fa";
import { MdOutlineSimCardDownload } from "react-icons/md";
import { HiMiniSparkles } from "react-icons/hi2";
import { MdDelete } from "react-icons/md";

import UserModalComponent from "../Navigation/UserModal";

interface DocumentComponentProps {
  settingConfig: SettingsConfiguration;
  APIhost: string | null;
  selectedChunk: DocumentChunk | null;
  setSelectedChunk: (s: any | null) => void;
  selectedDocument: Document | null;
  deletable: boolean;
  setDocuments?: (d: Document[] | null) => void;
  setTriggerReset?: (b: any) => void;
  production: boolean;
}

const DocumentComponent: React.FC<DocumentComponentProps> = ({
  APIhost,
  selectedChunk,
  settingConfig,
  selectedDocument,
  deletable,
  setSelectedChunk,
  setDocuments,
  setTriggerReset,
  production,
}) => {
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [formattedDocument, setFormattedDocument] =
    useState<FormattedDocument | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [showWholeDocument, setWholeDocument] = useState(false);

  const chunkRef = useRef<null | HTMLDivElement>(null);

  // Function to extract the src URL
  const extractSrc = (text: string) => {
    const urlRegex = /https?:\/\/[^\s]+/;
    const match = text.match(urlRegex);

    // The extracted link
    let link = match ? match[0] : "No link found";
    link = link.replace(/,$/, "");
    return link;
  };

  const srcLink = formattedDocument
    ? extractSrc(formattedDocument.substring)
    : "";

  useEffect(() => {
    if (selectedChunk != null && APIhost != null) {
      fetchDocuments();
    } else {
      setCurrentDocument(null);
    }
  }, [selectedChunk]);

  const fetchDocuments = async () => {
    if (selectedChunk != null && APIhost != null) {
      try {
        setIsFetching(true);

        const response = await fetch(APIhost + "/api/get_document", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            document_id: selectedChunk.doc_uuid,
          }),
        });
        const data: DocumentPayload = await response.json();

        if (data) {
          if (data.error !== "") {
            setCurrentDocument(null);
            console.error(data.error);
            setFormattedDocument(null);
            setIsFetching(false);
            setWholeDocument(false);
          } else {
            setCurrentDocument(data.document);
            setFormattedDocument(
              splitDocument(data.document.text, selectedChunk.text)
            );
            setIsFetching(false);
            if (chunkRef.current) {
              chunkRef.current.scrollIntoView({ behavior: "smooth" });
            }
            if (
              selectedChunk.text !== "" &&
              data.document.text.length >
                settingConfig.Chat.settings.max_document_size.value
            ) {
              setWholeDocument(false);
            } else {
              setWholeDocument(true);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch document:", error);
        setIsFetching(false);
      }
    }
  };

  const handleSourceClick = () => {
    // Open a new tab with the specified URL
    window.open(currentDocument?.link, "_blank", "noopener,noreferrer");
  };

  const handleDeleteDocument = async (uuid: string) => {
    try {
      console.log("DELETING " + uuid);
      fetch(APIhost + "/api/delete_document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ document_id: uuid }),
      });
      setCurrentDocument(null);
      setSelectedChunk(null);
      if (setDocuments) {
        setDocuments(null);
      }
      if (setTriggerReset) {
        setTriggerReset((prev: boolean) => !prev);
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  const handleDocumentShow = () => {
    setWholeDocument((prev) => !prev);
  };

  const openDeleteModal = () => {
    const modal = document.getElementById("delete_document_modal");
    if (modal instanceof HTMLDialogElement) {
      modal.showModal();
    }
  };

  if (currentDocument !== null && !isFetching) {
    return (
      <div className="flex flex-col bg-bg-alt-verba rounded-lg shadow-lg p-5 text-text-verba gap-5 sm:h-[53.5vh] lg:h-[65vh] overflow-auto">
        {/*Title*/}
        <div className="flex justify-between border-secondary-verba">
          <div className="flex flex-col">
            <a
              className="sm:text-sm md:text-lg font-semibold"
              href={srcLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: "none", color: "blue" }}
            >
              {srcLink}
            </a>
            <p className="sm:text-xs md:text-sm text-text-alt-verba">
              {currentDocument.type}
            </p>
          </div>
        </div>

        <div className="border-2 border-secondary-verba">
          {{ srcLink } ? (
            <iframe
              src={srcLink}
              title="Extracted Link"
              style={{ width: "100%", height: "100vh", border: "none" }}
            />
          ) : (
            <p>No link found.</p>
          )}
        </div>

        <UserModalComponent
          modal_id="delete_document_modal"
          title="Delete Document"
          text={"Do you want to delete " + currentDocument.name + "?"}
          triggerString="Delete"
          triggerValue={selectedChunk ? selectedChunk.doc_uuid : ""}
          triggerAccept={handleDeleteDocument}
        />
      </div>
    );
  } else {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-col bg-bg-alt-verba rounded-lg items-center justify-center shadow-lg p-5 text-text-verba gap-5 sm:h-[47vh] lg:h-[65vh] overflow-auto">
          {isFetching && (
            <div className="flex items-center justify-center pl-4 mb-4 gap-3">
              <PulseLoader
                color={settingConfig.Customization.settings.text_color.color}
                loading={true}
                size={10}
                speedMultiplier={0.75}
              />
              <p>Loading Document...</p>
            </div>
          )}
        </div>
      </div>
    );
  }
};

export default DocumentComponent;
