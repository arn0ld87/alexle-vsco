---
title: "Ticket-Routing mit KI-Agenten"
summary: "Aufbau eines Agenten-Workflows, der Support-Tickets automatisch kategorisiert und weiterleitet."
tags:
  - KI
  - Agenten
  - DevOps
heroImage: "/media/ticketrouting.png"
---

## Problem
Das Support-Team ordnete täglich 150+ Tickets manuell zu, wodurch SLA-Zeiten auf 4-6 Stunden stiegen und Wissensträger überlastet waren. 30% der Tickets wurden falsch kategorisiert und mussten eskaliert werden.

## Lösung & Vorgehen
- **Mehrstufiger Agenten-Workflow** auf Basis von OpenAI GPT-4o mini und firmeneigenen Embeddings
- **Tool-Aufrufe** für Wissensdatenbank (Confluence), Status-API (Jira) und E-Mail-Versand
- **Fallback-Strategien** bei Unsicherheit inkl. menschlichem Review-Queue
- **Training** mit 500+ historischen Tickets für bessere Klassifikation

## Architektur & Tech-Stack
- **Eingangspipeline**: Azure Functions mit Event Grid Trigger (99.9% Verfügbarkeit)
- **Agenten-Orchestrierung**: LangChain + Redis Queue für Skalierung
- **Observability**: Grafana/Prometheus + zentralem Audit-Log in PostgreSQL
- **APIs**: OpenAI GPT-4o mini, Azure Cognitive Services, Confluence REST API
- **Monitoring**: Custom Dashboards für Token-Verbrauch, Response-Zeiten und Accuracy

## Ergebnisse & Kennzahlen
- **40% schnellere Erstzuordnung**: Von 4-6h auf 2.5-3.5h reduziert
- **Accuracy-Rate**: 94% korrekte Kategorisierung (vs. 70% manuell)
- **Eskalationsrate**: Von 30% auf 8% gesenkt
- **Kosten**: 60% Reduktion der Support-Kosten durch Automatisierung
- **Transparente Metriken**: Real-time Dashboards für Auslastung und Fehlerraten
- **ROI**: Break-even nach 3 Monaten, 200% ROI nach 6 Monaten

## Nächste Schritte
- Automatisierte Antwortvorschläge für Standardfragen
- Erweiterung um Voice-to-Ticket für Hotline-Eingänge
- Ausbau der Guardrails (PII-Filter, Halluzinations-Checks) für weitere Use Cases