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
	resource.id = newStringOrUndefined(result.bookingID);

	resource.status = newStringOrUndefined(result.status);

    //Specialty
	if (result.specialtyName) {
        
        resource.specialty = [];

	    const emptySpecialty = {
	    	coding: [{
		    	system: undefined,
			    code: undefined,
			    display: undefined
    		}]
    	};
    	var specialtyEntry = JSON.parse(JSON.stringify(emptySpecialty));

        specialtyEntry.coding[0].system = newStringOrUndefined(
                result.NSCType
			);
		specialtyEntry.coding[0].code = newStringOrUndefined(
		    result.NSC
	    	);
		specialtyEntry.coding[0].display = newStringOrUndefined(
			result.specialtyName
			);
		resource.specialty.push(specialtyEntry);
	}
    
    //Service
	if (result.serviceName) {
        
        resource.serviceType = [];

	    const emptyService = {
	    	coding: [{
		    	system: undefined,
			    code: undefined,
			    display: undefined
    		}]
    	};
    	var serviceEntry = JSON.parse(JSON.stringify(emptyService));

        serviceEntry.coding[0].system = newStringOrUndefined(
                result.NTCType
			);
            serviceEntry.coding[0].code = newStringOrUndefined(
		    result.NTC
	    	);
            serviceEntry.coding[0].display = newStringOrUndefined(
			result.serviceName
			);
		resource.serviceType.push(serviceEntry);
	}
    
    //Priority
    resource.priority = newStringOrUndefined(result.priorityValue)


	//Datetime of Appointment
	resource.start = newStringOrUndefined(result.Start_Date);
	resource.end = newStringOrUndefined(result.End_Date);
	resource.minutesDuration = newStringOrUndefined(result.duration);

	if (result.listOwner){

	const participantConsultant = {
		type: [{
			coding: [{
				system: 'https://www.hl7.org/fhir/valueset-encounter-participant-type.html',
				code: 'CON',
				display: 'consultant'
			}]
		}],
		actor: {
			display: result.listOwner
		},
		status: 'accepted'
	};
	resource.participant.push(participantConsultant);
	}
	//Add Extension
	const extension = [];
	
	if (result.status=='cancelled') {
        // Add Cancellation Reason extension
        const apptcancellationExtension = {
            url: newStringOrUndefined(
                'https://fhir.hl7.org.uk/STU3/StructureDefinition/Extension-CareConnect-AppointmentCancellationReason-1'
                ),
            valueString: newStringOrUndefined(result.cancelReason)
        };
        extension.push(apptcancellationExtension);
    }
    
	if (extension.length > 0) {
		resource.extension = extension;
	}
	
	resource.subject = {
		reference: $cfg('apiUrl') + '/patient/' + result.MRN
	};
	
	return resource;
}