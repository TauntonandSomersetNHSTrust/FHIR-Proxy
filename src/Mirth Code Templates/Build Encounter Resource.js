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

	// Add meta data
	if (
		result.Last_Updated !== undefined &&
		result.Last_Updated.substring(0, 1) != 'T' &&
		result.Last_Updated.substring(0, 4) != '1900'
	) {
		resource.meta.lastUpdated = result.Last_Updated;
	}

	if (result.className !== undefined) {
		resource.class = {
			system: 'https://hl7.org/fhir/v3/ActEncounterCode',
			code: newStringOrUndefined(result.classCode),
			display: newStringOrUndefined(result.className)
		};
	}

	/**
	 * Add SIDeR specific tags
	 * Only display in summary and detail view if within last 30 days,
	 * don't display any planned/future encounters as they're out of scope
	 */
	if (
		result.Start_Date !== undefined &&
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
		result.status !== undefined &&
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
    
	////
	//Array structure should be:
	//system,code,display|system,code,display|system,code,display
	////
	if (
		result.encountertype !== undefined
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
		const primitiveEncounterType = JSON.parse(JSON.stringify(emptyType));
		if (result.Service_Code !== undefined) {
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
	
 	if (
		result.encounterParticipantIndividualCode_admitting !== undefined &&
		result.encounterParticipantIndividualCode_discharging !== undefined &&
		result.encounterParticipantIndividualCode_discharging ==
			result.encounterParticipantIndividualCode_admitting
	) {
		const participantCombo = {
			type: [
				{
					coding: [
						{
							system: 'https://hl7.org/fhir/v3/ParticipationType',
							code: 'ADM',
							display: 'admitter'
						}
					]
				},
				{
					coding: [
						{
							system: 'https://hl7.org/fhir/v3/ParticipationType',
							code: 'DIS',
							display: 'discharger'
						}
					]
				}
			],
			individual: {
				identifier: {
					value: result.encounterParticipantIndividualCode_admitting
				},

				display: result.encounterParticipantIndividualDisplay_admitting
			}
		};
		resource.participant.push(participantCombo);
	}

	if (resource.participant.length === 0) {
		if (result.encounterParticipantIndividualCode_admitting !== undefined) {
			const participantAdmitter = {
				type: [
					{
						coding: [
							{
								system:
									'https://hl7.org/fhir/v3/ParticipationType',
								code: 'ADM',
								display: 'admitter'
							}
						]
					}
				],
				individual: {
					identifier: {
						value:
							result.encounterParticipantIndividualCode_admitting
					},
					display:
						result.encounterParticipantIndividualDisplay_admitting
				}
			};
			resource.participant.push(participantAdmitter);
		}
		if (
			result.encounterParticipantIndividualCode_discharging !== undefined
		) {
			const participantDischarger = {
				type: [
					{
						coding: [
							{
								system:
									'https://hl7.org/fhir/v3/ParticipationType',
								code: 'DIS',
								display: 'discharger'
							}
						]
					}
				],
				individual: {
					identifier: {
						value:
							result.encounterParticipantIndividualCode_discharging
					},
					display:
						result.encounterParticipantIndividualDisplay_discharging
				}
			};
			resource.participant.push(participantDischarger);
		}
	}
	if (result.encounterParticipantIndividualCode_opattending !== undefined) {
		const participantConsultant = {
			type: [
				{
					coding: [
						{
							system: 'https://hl7.org/fhir/v3/ParticipationType',
							code: 'CON',
							display: 'consultant'
						}
					]
				}
			],
			individual: {
				identifier:
					result.encounterParticipantIndividualCode_opattending,
				display:
					result.encounterParticipantIndividualDisplay_opattending
			}
		};
		resource.participant.push(participantConsultant);
	}

	resource.period = {};
	if (
		result.Start_Date !== undefined &&
		result.Start_Date.substring(0, 1) != 'T' &&
		result.Start_Date.substring(0, 4) != '1900'
	) {
		resource.period.start = result.Start_Date;
	}
	if (
		result.End_Date !== undefined &&
		result.End_Date.substring(0, 1) != 'T' &&
		result.End_Date.substring(0, 4) != '1900'
	) {
		resource.period.end = result.End_Date;
	}

	// Add admission and discharge inpatient details
	resource.hospitalization = {};

	if (
		result.encounterAdmissionmethodCodingCode !== undefined ||
		result.encounterDischargemethodCodingCode !== undefined
	) {
		resource.hospitalization.extension = [];
	}

	if (result.encounterAdmissionmethodCodingCode !== undefined) {
		const admissionMethod = {
			url:
				'https://fhir.hl7.org.uk/STU3/StructureDefinition/Extension-CareConnect-AdmissionMethod-1',
			valueCodeableConcept: {
				coding: [
					{
						system:
							'https://fhir.hl7.org.uk/STU3/ValueSet/CareConnect-AdmissionMethod-1',
						code: result.encounterAdmissionmethodCodingCode,
						display: newStringOrUndefined(
							result.encounterAdmissionmethodCodingDesc
						)
					}
				]
			}
		};
		resource.hospitalization.extension.push(admissionMethod);
	}

	if (result.encounterDischargemethodCodingCode !== undefined) {
		const dischargeMethod = {
			url:
				'https://fhir.hl7.org.uk/STU3/StructureDefinition/Extension-CareConnect-DischargeMethod-1',
			valueCodeableConcept: {
				coding: [
					{
						system:
							'https://fhir.hl7.org.uk/STU3/ValueSet/CareConnect-DischargeMethod-1',
						code: result.encounterDischargemethodCodingCode,
						display: newStringOrUndefined(
							result.encounterDischargemethodCodingDesc
						)
					}
				]
			}
		};
		resource.hospitalization.extension.push(dischargeMethod);
	}

	if (result.encounterHospitalizationAdmitsourceCodingCode !== undefined) {
		resource.hospitalization.admitSource = {
			coding: [
				{
					system:
						'https://fhir.hl7.org.uk/STU3/CodeSystem/CareConnect-SourceOfAdmission-1',
					code: result.encounterHospitalizationAdmitsourceCodingCode,
					display: newStringOrUndefined(
						result.encounterHospitalizationAdmitsourceCodingDesc
					)
				}
			]
		};
	}
	if (
		result.encounterHospitalizationDischargedispositionCodingCode !==
		undefined
	) {
		resource.hospitalization.dischargeDisposition = {
			coding: [
				{
					system:
						'https://fhir.hl7.org.uk/STU3/CodeSystem/CareConnect-DischargeDestination-1',
					code:
						result.encounterHospitalizationDischargedispositionCodingCode,
					display: newStringOrUndefined(
						result.encounterHospitalizationDischargedispositionCodingDesc
					)
				}
			]
		};
	}

	// Add location details
	if (
		result.encounterClassCode !== undefined &&
		result.encounterClassCode == 'XXIMP'
	) {
		resource.location = [];

		const emptyLocation = {
			location: {
				identifier: {
					value: undefined
				},
				display: undefined
			},
			period: {
				start: undefined,
				end: undefined
			}
		};

		if (
			result.encounterLocation1Identifier !== undefined &&
			typeof resource.period.start !== 'undefined'
		) {
			const admittingWard = JSON.parse(JSON.stringify(emptyLocation));

			admittingWard.location.identifier.value = newStringOrUndefined(
				result.encounterLocation1Identifier
			);
			admittingWard.location.display = newStringOrUndefined(
				result.encounterLocation1Display
			);

			admittingWard.period.start = resource.period.start;
			resource.location.push(admittingWard);
		}

		if (
			result.encounterLocation2Identifier !== undefined &&
			typeof resource.period.end !== 'undefined'
		) {
			const dischargeWard = JSON.parse(JSON.stringify(emptyLocation));

			dischargeWard.location.identifier.value = newStringOrUndefined(
				result.encounterLocation2Identifier
			);
			dischargeWard.location.display = newStringOrUndefined(
				result.encounterLocation2Display
			);

			dischargeWard.period.end = resource.period.end;
			resource.location.push(dischargeWard);
		}
	}

	resource.subject = {
		reference: $cfg('apiUrl') + '/patient/' + result.MRN
	};

	return resource;
}
