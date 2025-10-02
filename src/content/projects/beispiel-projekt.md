---
title: "Ticket-Routing mit KI-Agenten"
summary: "Aufbau eines Agenten-Workflows, der Support-Tickets automatisch kategorisiert und weiterleitet."
tags:
  - KI
  - Agenten
  - DevOps
heroImage: "/media/ki_agenten.png"
---
## Problem
Das Support-Team ordnete Tickets manuell zu, wodurch SLA-Zeiten stiegen und Wissensträger überlastet waren.

## Lösung & Vorgehen
- Mehrstufiger Agenten-Workflow auf Basis von OpenAI GPT-4o mini und firmeneigenen Embeddings
- Tool-Aufrufe für Wissensdatenbank, Status-API und E-Mail-Versand
- Fallback-Strategien bei Unsicherheit inkl. menschlichem Review-Queue

## Architektur
- Eingangspipeline in Azure Functions mit Event Grid Trigger
- Agenten-Orchestrierung über LangChain + Redis Queue
- Observability via Grafana/Prometheus + zentralem Audit-Log in PostgreSQL

## Ergebnisse
- 40 % schnellere Erstzuordnung der Tickets
- Transparente Metriken für Auslastung und Fehlerraten
- Signifikant weniger Eskalationen im 2nd-Level-Support

## Nächste Schritte
- Automatisierte Antwortvorschläge für Standardfragen
- Erweiterung um Voice-to-Ticket für Hotline-Eingänge
- Ausbau der Guardrails (PII-Filter, Halluzinations-Checks) für weitere Use Cases
