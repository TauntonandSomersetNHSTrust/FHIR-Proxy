/**
	Builds Appointment FHIR Resource that adheres to its Care-Connect profile,
	see https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Appointment-1 for more info.

	@author Julian Matthews
	@param {Object} data - Java RowSet object.
	@return {Object} Flag FHIR resource.
 */
function buildAppointmentResource(data) {
	var result = getResultSet(data);
	/**
	 * Hard-coding meta profile and resourceType into resource as this should not
	 * be changed for this resource, ever.
	 */
	var resource = {
		meta: {
			profile: ['https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Appointment-1']
		},
		resourceType: 'Appointment'
	};
	// Add meta data
	if (
		result.Last_Updated &&
		result.Last_Updated.substring(0, 1) != 'T' &&
		result.Last_Updated.substring(0, 1) != '1900'
	) {
		resource.meta.lastUpdated = newStringOrUndefined(result.Last_Updated);
	}
	resource.id = newStringOrUndefined(result.patientAppointmentID);

	resource.status = newStringOrUndefined(result.patientAppointmentstatus);


	/**
	 * result.specialty is provided as an array to be processed and applied to the resource.specialty array.
	 * Array structure is:
	 * system,code,display|system,code,display|system,code,display
	 */

	resource.specialty = [];

	const emptySpecialty = {
		coding: [{
			system: undefined,
			code: undefined,
			display: undefined
		}]
	};

	if (result.specialty) {
		const specialtySplit = result.specialty.split('\\|');
		for (var i = 0; i < specialtySplit.length; i++) {
			var specialtyEntry = JSON.parse(JSON.stringify(emptySpecialty));
			var specialtyArray = specialtySplit[i].toString();
			var components = specialtyArray.split('\\,');

			specialtyEntry.coding[0].system = newStringOrUndefined(
				components[0]
			);
			specialtyEntry.coding[0].code = newStringOrUndefined(
				components[1]
			);
			specialtyEntry.coding[0].display = newStringOrUndefined(
				components[2]
			);
			resource.specialty.push(BodySiteEntry);
		}
	}


	//Datetime of Appointment
	resource.start = newStringOrUndefined(result.start);
	resource.end = newStringOrUndefined(result.end);
	resource.minutesDuration = newStringOrUndefined(result.minutesDuration);

	//Add Patient To Appt
	resource.participant = [];
	const patientAsParticipant = {
		reference: $cfg('apiUrl') + '/patient/' + result.MRN
	};
	resource.participant.push(patientAsParticipant);

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
	
	//Add Extension
	const extension = [];
	
	// Add Cancellation Reason extension
	if (result.status==='cancelled') {
		const apptcancellationExtension = {
			url: newStringOrUndefined(
				'https://fhir.hl7.org.uk/STU3/StructureDefinition/Extension-CareConnect-AppointmentCancellationReason-1'
			),
			valueString: newStringOrUndefined(result.cancellationReason)
			};
		}
	extension.push(ethCatExtension);
	
	if (extension.length > 0) {
		resource.extension = extension;
	}
	
	resource.subject = {
		reference: $cfg('apiUrl') + '/patient/' + result.MRN
	};
	
	return resource;
}