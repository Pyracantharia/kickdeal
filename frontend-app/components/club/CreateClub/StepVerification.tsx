"use client";

import React, { useRef, useState } from "react";
import {
  Upload,
  Mail,
  MessageSquare,
  Info,
  CheckCircle2,
  X,
} from "lucide-react";

import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { VerificationMethod } from "@/features/club/mockClubs";

interface StepVerificationProps {
  verifications: VerificationMethod[];
  onChange: (v: VerificationMethod[]) => void;
}

function MethodCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-brand-cyan/50 hover:bg-white/10 cursor-pointer"
    >
      <span aria-hidden="true">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </button>
  );
}

function ConfirmedCard({
  icon,
  title,
  value,
  onClear,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-brand-cyan/40 bg-brand-cyan/10 p-4">
      <span aria-hidden="true">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-cyan mb-0.5">
          {title}
        </p>
        <p className="text-sm text-white break-all line-clamp-2">{value}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <CheckCircle2 className="h-5 w-5 text-brand-cyan" aria-hidden="true" />
        <button
          type="button"
          onClick={onClear}
          className="text-gray-400 hover:text-white transition-colors focus:outline-none focus-visible:text-white"
          aria-label="Supprimer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function StepVerification({ verifications, onChange }: StepVerificationProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [emailModal, setEmailModal] = useState(false);
  const [messageModal, setMessageModal] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [messageValue, setMessageValue] = useState("");

  const docEntry = verifications.find((v) => v.type === "document") as
    | Extract<VerificationMethod, { type: "document" }>
    | undefined;
  const emailEntry = verifications.find((v) => v.type === "email") as
    | Extract<VerificationMethod, { type: "email" }>
    | undefined;
  const messageEntry = verifications.find((v) => v.type === "message") as
    | Extract<VerificationMethod, { type: "message" }>
    | undefined;

  function addOrReplace(entry: VerificationMethod) {
    onChange([...verifications.filter((v) => v.type !== entry.type), entry]);
  }

  function remove(type: VerificationMethod["type"]) {
    onChange(verifications.filter((v) => v.type !== type));
    if (type === "document" && fileInputRef.current)
      fileInputRef.current.value = "";
    if (type === "email") setEmailValue("");
    if (type === "message") setMessageValue("");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) addOrReplace({ type: "document", file });
  }

  function handleEmailSubmit() {
    if (!emailValue.trim()) return;
    addOrReplace({ type: "email", email: emailValue.trim() });
    setEmailModal(false);
  }

  function handleMessageSubmit() {
    if (!messageValue.trim()) return;
    addOrReplace({ type: "message", message: messageValue.trim() });
    setMessageModal(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-bold text-white uppercase mb-1">
          Vérification d&apos;appartenance
        </h2>
        <p className="text-sm text-gray-300">
          Pour éviter les abus, veuillez prouver votre appartenance au club.
        </p>
      </div>

      <div className="flex gap-3 items-start rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
        <Info
          className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold text-yellow-400">
            Vérification obligatoire
          </p>
          <p className="text-xs text-gray-300 mt-0.5">
            Au moins une méthode est requise. Vous pouvez en ajouter
            jusqu&apos;à 3 pour renforcer votre dossier.
          </p>
        </div>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
        Choisissez une ou plusieurs méthodes
      </p>

      <div className="flex flex-col gap-3">
        {docEntry ? (
          <ConfirmedCard icon={<Upload className="h-5 w-5 text-brand-cyan" />} title="Document officiel" value={docEntry.file.name} onClear={() => remove("document")} />
        ) : (
          <MethodCard
            icon={<Upload className="h-5 w-5 text-gray-400" />}
            title="Document officiel"
            description="Licence, contrat de travail, attestation du club"
            onClick={() => fileInputRef.current?.click()}
          />
        )}

        {emailEntry ? (
          <ConfirmedCard
            icon={<Mail className="h-5 w-5 text-brand-cyan" />}
            title="Email professionnel"
            value={emailEntry.email}
            onClear={() => remove("email")}
          />
        ) : (
          <MethodCard
            icon={<Mail className="h-5 w-5 text-gray-400" />}
            title="Email professionnel"
            description="Ex: votre.nom@nomduclub.com"
            onClick={() => {
              setEmailValue("");
              setEmailModal(true);
            }}
          />
        )}

        {messageEntry ? (
          <ConfirmedCard
            icon={<MessageSquare className="h-5 w-5 text-brand-cyan" />}
            title="Message explicatif"
            value={messageEntry.message}
            onClear={() => remove("message")}
          />
        ) : (
          <MethodCard
            icon={<MessageSquare className="h-5 w-5 text-gray-400" />}
            title="Message explicatif"
            description="Expliquez votre lien avec le club"
            onClick={() => {
              setMessageValue("");
              setMessageModal(true);
            }}
          />
        )}
      </div>

      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileChange}/>

      <Modal isOpen={emailModal} onClose={() => setEmailModal(false)} title="Email professionnel">
        <div className="flex flex-col gap-4">
          <Input
            label="Votre email professionnel"
            type="email"
            placeholder="votre.nom@nomduclub.com"
            icon={<Mail className="h-5 w-5" />}
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
            autoFocus
          />
          <Button type="button" onClick={handleEmailSubmit} disabled={!emailValue.trim()} className="w-full">
            Confirmer
          </Button>
        </div>
      </Modal>

      <Modal isOpen={messageModal} onClose={() => setMessageModal(false)} title="Message explicatif">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-200">
              Votre message
            </label>
            <textarea
              value={messageValue}
              onChange={(e) => setMessageValue(e.target.value)}
              placeholder="Expliquez votre lien avec le club..."
              rows={4}
              autoFocus
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none resize-none transition-all focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan/50"
            />
          </div>
          <Button type="button" onClick={handleMessageSubmit} disabled={!messageValue.trim()} className="w-full">
            Confirmer
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default StepVerification;