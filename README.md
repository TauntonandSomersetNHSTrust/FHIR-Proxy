<img alttext="Somerset NHS Foundation Trust Logo" src="https://www.somersetft.nhs.uk/wp-content/uploads/2020/03/Asset-1.png" width="413" style="background:white" />

# Somerset NHS Foundation Trust - FHIR Proxy

Somerset NHS Foundation Trust Mirth Connect FHIR Listener channels adapted for use with various clinical systems within the organisations ecosystem.

## Introduction

### Purpose

This repo contains the various changes made to existing works by [Colleagues working at Yeovi District Hospital](https://github.com/Fdawgs/ydh-fhir-listeners) to use within our own organisation. The influences of this base will feature heavily throughout the repo, however will diverge where faced with the variation of clinical systems used in the our organisation.

This documentation is written under the assumption that the reader has prior experience using [Mirth Connect](https://github.com/nextgenhealthcare/connect).

### Background

[Somerset Clinical Commissioning Group](https://www.somersetccg.nhs.uk/#) (CCG) started the [SIDeR project](https://www.somersetccg.nhs.uk/your-health/sharing-your-information/sider/) with the purpose of linking up all main clinical and social care IT systems used in Somerset to improve and support direct care. [Black Pear Software Ltd.](https://www.blackpear.com/) (BP) is the technical partner that supports the project.

Stakeholders (as of 2020-11-24) are:

-   [Children's Hospice South West](https://www.chsw.org.uk/) (CHSW)
-   [Devon Doctors](https://www.devondoctors.co.uk/) (DD)
-   [Dorothy House Hospice](https://www.dorothyhouse.org.uk/) (DHH)
-   GP practices within Somerset (GPs)
-   [Somerset County Council](https://www.somerset.gov.uk/) (SCC)
-   [Somerset NHS Foundation Trust](https://www.somersetft.nhs.uk/) (SFT)
-   [South Western Ambulance Service NHS Foundation Trust](https://www.swast.nhs.uk/) (SWASFT)
-   [St Margaret’s Hospice](https://www.somerset-hospice.org.uk/) (SMH)
-   [Yeovil District Hospital NHS Foundation Trust](https://yeovilhospital.co.uk/) (YDH)

### Deliverables

#### Care Connect RESTful FHIR API endpoints

Black Pear have built a single-page web application for a shared care record, which will retrieve data relating to a patient from each stakeholder that have the capability to do so, and amalgamate it into this record. The record is not stored in a cache anywhere and is built on the fly.
Care providers can then access this record through a contextual link (an embedded link within the PAS).
Clients using the web app need to be able to make GET requests to RESTful HL7® FHIR® API endpoints to retrieve a set of FHIR resources that adhere to their respective [NHS Care Connect API profiles](https://nhsconnect.github.io/CareConnectAPI/) to populate the record.
