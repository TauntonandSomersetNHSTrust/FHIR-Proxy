/**
	Builds Encounter FHIR Resource that adheres to its Care-Connect profile,
	see https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Encounter-1 for more info.
 
	@author Julian Matthews
	@param {Object} data - Java RowSet object.
	@return {Object} Encounter FHIR resource.
	
 */
function buildEncounterResource(data) {
	const result = getResultSet(data);
	/**
	 * Hard-coding meta profile and resourceType into resource as this should not
	 * be changed for this resource, ever.
	 */
	const resource = {
		meta: {
			profile: [
				'https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Encounter-1'
			]
		},
		resourceType: 'Encounter'
	};

	resource.id = newStringOrUndefined(result.Encounter_ID);
	resource.status = newStringOrUndefined(result.status);

	// Only add a valid date to metadata
	if (
		result.Last_Updated &&
		result.Last_Updated.substring(0, 1) != 'T' &&
		result.Last_Updated.substring(0, 4) != '1900'
	) {
		resource.meta.lastUpdated = result.Last_Updated;
	}

	/**
	 * Add SIDeR specific tags to metadata
	 * Only display in summary and detail view if within last 30 days,
	 * don't display any planned/future encounters as they're out of scope
	 */

	if (
		result.Start_Date &&
		result.Start_Date.substring(0, 1) != 'T' &&
		result.Start_Date.substring(0, 4) != '1900' &&
		Math.ceil(
			(new Date(result.Start_Date) - new Date()) /
				(24 * 60 * 60 * 1000)
		) >= -30
	) {
		resource.meta.tag = [
			{
				system:
					'https://fhir.blackpear.com/ui/shared-care-record-visibility',
				code: 'summary',
				display: 'Display in Summary and Detail View'
			}
		];
	} else {
		resource.meta.tag = [
			{
				system:
					'https://fhir.blackpear.com/ui/shared-care-record-visibility',
				code: 'detail',
				display: 'Display in Detail View'
			}
		];
	}

	if (
		result.status &&
		result.status == 'planned'
	) {
		resource.meta.tag = [
			{
				system:
					'https://fhir.blackpear.com/ui/shared-care-record-visibility',
				code: 'none',
				display: 'Do not Display'
			}
		];
	}
	
	if (result.className) {
			resource.class = {
				system: 'https://hl7.org/fhir/v3/ActEncounterCode',
				code: newStringOrUndefined(result.classCode),
				display: newStringOrUndefined(result.className)
			};
		}
	
	// Add type element content
	resource.type = [];

	const emptyType = {
		coding: [
			{
				system: undefined,
				code: undefined,
				display: undefined
			}
		]
	};

	/**
	* result.encountertype is provided as an array to be processed and applied to the resource.type array.
	* Array structure is:
	* system,code,display|system,code,display|system,code,display
	*/

	if (
		result.encountertype
	) {
		
		const encounterSplit = result.encountertype.split('\\|');
		for (var i=0; i < encounterSplit.length; i++){
			
			var EncounterTypeEntry = JSON.parse(JSON.stringify(emptyType));
			
			var EncounterArray = encounterSplit[i].toString();
			
			var components = EncounterArray.split('\\,');
			
			EncounterTypeEntry.coding[0].system = newStringOrUndefined(
				components[0]
			);
			EncounterTypeEntry.coding[0].code = newStringOrUndefined(
				components[1]
			);
			EncounterTypeEntry.coding[0].display = newStringOrUndefined(
				components[2]
			);
			resource.type.push(EncounterTypeEntry);
		}
	} else {
		
		/**
		 * The else contains the legacy way of building up the resource.type elements.
		 * This was based on the source data only providing the treatment function code for the specialty.
		 */
		
		const primitiveEncounterType = JSON.parse(JSON.stringify(emptyType));
		if (result.Service) {
			primitiveEncounterType.coding[0].system = 'https://fhir.nhs.uk/STU3/CodeSystem/Specialty-1'
			;
			primitiveEncounterType.coding[0].code = newStringOrUndefined(
				result.Service_Code
			);
			primitiveEncounterType.coding[0].display = newStringOrUndefined(
				result.Service
			);
			resource.type.push(primitiveEncounterType);
		}
	}

	// Add participants
	resource.participant = [];
	
	// Inpatient paticipants
	if(
		result.classCode == 'IMP'
		)
	{
		// If the same person admitted and discharged, build participantCombo
		if(
			result.disHCP == result.admHCP 
			) 
		{
			const participantCombo = {
				type: [{
					coding: [{
						system: 'https://www.hl7.org/fhir/valueset-encounter-participant-type.html',
						code: 'ADM',
						display: 'admitter'
					}]
				}, {
					coding: [{
						system: 'https://www.hl7.org/fhir/valueset-encounter-participant-type.html',
						code: 'DIS',
						display: 'discharger'
					}]
				}],
				individual: {
					identifier: {
						value: result.encounterParticipantIndividualCode_admitting
					},
					display: result.admHCP
				}
			};
			resource.participant.push(participantCombo);
		}
		// otherwise, add individually
		else {
			if(result.disHCP) {
				const participantDischarger = {
					type: [{
						coding: [{
							system: 'https://www.hl7.org/fhir/valueset-encounter-participant-type.html',
							code: 'DIS',
							display: 'discharger'
						}]
					}],
					individual: {
						identifier: {
							value: result.encounterParticipantIndividualCode_discharging
						},
						display: result.disHCP
					}
				};
				resource.participant.push(participantDischarger);
			}
			if(result.admHCP) {
				const participantAdmitter = {
					type: [{
						coding: [{
							system: 'https://www.hl7.org/fhir/valueset-encounter-participant-type.html',
							code: 'ADM',
							display: 'admitter'
						}]
					}],
					individual: {
						identifier: {
							value: result.encounterParticipantIndividualCode_admitting
						},
						display: result.admHCP
					}
				};
				resource.participant.push(participantAdmitter);
			}
		}
	} 
	
	// Outpatient participant
	else if(
		result.classCode == 'AMB'
		) 
	{
		if(result.seenBy) {
			const participantConsultant = {
				type: [{
					coding: [{
						system: 'https://www.hl7.org/fhir/valueset-encounter-participant-type.html',
						code: 'CON',
						display: 'consultant'
					}]
				}],
				individual: {
					identifier: result.encounterParticipantIndividualCode_opattending,
					display: result.seenBy
				}
			};
			resource.participant.push(participantConsultant);
		}
	} 
	// A&E Participant
	else if(
		result.classCode == 'EMER'
		) 
	{
		/**
		 * TODO
		 * 
		 */
	} 
	// Unexpected code returned, add no participants
	else {} 

	resource.period = {};
	if (
		result.Start_Date &&
		result.Start_Date.substring(0, 1) != 'T' &&
		result.Start_Date.substring(0, 4) != '1900'
	) {
		resource.period.start = result.Start_Date;
	}
	if (
		result.End_Date &&
		result.End_Date.substring(0, 1) != 'T' &&
		result.End_Date.substring(0, 4) != '1900'
	) {
		resource.period.end = result.End_Date;
	}

	// Add admission and discharge inpatient details
	if(
		result.classCode == 'IMP'
	) {
		resource.hospitalization = {};
		
		if(
			result.encounterAdmissionmethodCodingCode || result.encounterDischargemethodCodingCode
		) {
			resource.hospitalization.extension = [];
		}
		if(result.encounterAdmissionmethodCodingCode) {
			const admissionMethod = {
				url: 'https://fhir.hl7.org.uk/STU3/StructureDefinition/Extension-CareConnect-AdmissionMethod-1',
				valueCodeableConcept: {
					coding: [{
						system: 'https://fhir.hl7.org.uk/STU3/ValueSet/CareConnect-AdmissionMethod-1',
						code: result.encounterAdmissionmethodCodingCode,
						display: newStringOrUndefined(result.encounterAdmissionmethodCodingDesc)
					}]
				}
			};
			resource.hospitalization.extension.push(admissionMethod);
		}
		if(result.encounterDischargemethodCodingCode) {
			const dischargeMethod = {
				url: 'https://fhir.hl7.org.uk/STU3/StructureDefinition/Extension-CareConnect-DischargeMethod-1',
				valueCodeableConcept: {
					coding: [{
						system: 'https://fhir.hl7.org.uk/STU3/ValueSet/CareConnect-DischargeMethod-1',
						code: result.encounterDischargemethodCodingCode,
						display: newStringOrUndefined(result.encounterDischargemethodCodingDesc)
					}]
				}
			};
			resource.hospitalization.extension.push(dischargeMethod);
		}
		if(result.encounterHospitalizationAdmitsourceCodingCode) {
			resource.hospitalization.admitSource = {
				coding: [{
					system: 'https://fhir.hl7.org.uk/STU3/CodeSystem/CareConnect-SourceOfAdmission-1',
					code: result.encounterHospitalizationAdmitsourceCodingCode,
					display: newStringOrUndefined(result.encounterHospitalizationAdmitsourceCodingDesc)
				}]
			};
		}
		if(result.encounterHospitalizationDischargedispositionCodingCode !== undefined) {
			resource.hospitalization.dischargeDisposition = {
				coding: [{
					system: 'https://fhir.hl7.org.uk/STU3/CodeSystem/CareConnect-DischargeDestination-1',
					code: result.encounterHospitalizationDischargedispositionCodingCode,
					display: newStringOrUndefined(result.encounterHospitalizationDischargedispositionCodingDesc)
				}]
			};
		}
	}

	resource.subject = {
		reference: $cfg('apiUrl') + '/patient/' + result.MRN
	};

	return resource;
}
