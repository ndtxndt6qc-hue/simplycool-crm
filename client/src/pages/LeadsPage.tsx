import { useState } from "react";
import type { LeadStatus } from "@klimainstall/shared";
import { LEAD_QUELLE_LABELS, LEAD_STATUS_LABELS, LEAD_STATUS_ORDER } from "../lib/labels";
import { useLeads, useUpdateLead, type Lead } from "../lib/leads";
import { LeadFormModal } from "../components/LeadFormModal";
import { CreateQuoteFromLeadModal } from "../components/CreateQuoteFromLeadModal";

export function LeadsPage() {
  const { data: leads, isLoading } = useLeads();
  const updateLead = useUpdateLead();
  const [editingLead, setEditingLead] = useState<Lead | null | undefined>(undefined);
  const [quotingLead, setQuotingLead] = useState<Lead | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<LeadStatus | null>(null);

  function handleDrop(status: LeadStatus, e: React.DragEvent) {
    e.preventDefault();
    setDragOverStatus(null);
    const id = Number(e.dataTransfer.getData("text/lead-id"));
    if (!id) return;
    const lead = leads?.find((l) => l.id === id);
    if (!lead || lead.status === status) return;
    updateLead.mutate({ id, status });
  }

  return (
    <div>
      <div className="page-header">
        <h1>Leads</h1>
        <button className="btn btn-primary" onClick={() => setEditingLead(null)}>
          + Neuer Lead
        </button>
      </div>

      {isLoading ? (
        <p style={{ color: "var(--color-text-muted)" }}>Lädt…</p>
      ) : (
        <div className="kanban-board">
          {LEAD_STATUS_ORDER.map((status) => {
            const columnLeads = leads?.filter((l) => l.status === status) ?? [];
            return (
              <div
                key={status}
                className={`kanban-column${dragOverStatus === status ? " drag-over" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverStatus(status);
                }}
                onDragLeave={() => setDragOverStatus((s) => (s === status ? null : s))}
                onDrop={(e) => handleDrop(status, e)}
              >
                <div className="kanban-column-header">
                  <span className="kanban-column-title">{LEAD_STATUS_LABELS[status]}</span>
                  <span className="kanban-count">{columnLeads.length}</span>
                </div>
                {columnLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="kanban-card"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/lead-id", String(lead.id))}
                    onClick={() => setEditingLead(lead)}
                  >
                    <div className="kanban-card-name">{lead.name}</div>
                    <div className="kanban-card-meta">
                      {lead.telefon && <span>{lead.telefon}</span>}
                      {lead.email && <span>{lead.email}</span>}
                      <span className="badge badge-neutral" style={{ marginTop: 4, alignSelf: "flex-start" }}>
                        {LEAD_QUELLE_LABELS[lead.quelle]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {editingLead !== undefined && (
        <LeadFormModal
          lead={editingLead}
          onClose={() => setEditingLead(undefined)}
          onCreateQuote={(lead) => {
            setEditingLead(undefined);
            setQuotingLead(lead);
          }}
        />
      )}

      {quotingLead && <CreateQuoteFromLeadModal lead={quotingLead} onClose={() => setQuotingLead(null)} />}
    </div>
  );
}
