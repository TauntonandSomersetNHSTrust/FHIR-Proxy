/**
	Builds Condition FHIR Resource that adheres to its Care-Connect profile,
	see https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Condition-1 for more info.

	@author Julian Matthews
	@param {Object} data - Java RowSet object.
	@return {Object} Condition FHIR resource.
 */

/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
 
function buildConditionResource(data) {
	
	const result = getResultSet(data);

	// Hard-coding meta profile and resourceType into resource as this shouldn't
	// be changed for this resource, ever.
	var resource = {
		meta: {
			profile: [
				'https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Condition-1'
			]
		},
		resourceType: 'Condition',

	};

	resource.id = newStringOrUndefined(result.PTdiagnosisID);
	resource.clinicalStatus = newStringOrUndefined(result.clinicalStatus);

	resource.code = {
		coding:{
			system: 'http://snomed.info/sct',
			code:newStringOrUndefined(result.snomedCode)
			},
			text: newStringOrUndefined(result.diagnosisName)
		};
	
	if (
		result.dateOnset == 'Not Recorded In PAS'
	) {
			resource.onsetString = newStringOrUndefined(result.dateOnset);
	}
	else {
		resource.onsetDateTime = newStringOrUndefined(result.dateOnset);
	}
	
	if (result.authHCP !== undefined)
	{
		resource.asserter = {};
		resource.asserter.display = result.authHCP;
	}

	resource.assertedDate = newStringOrUndefined(result.authdate);
	resource.abatementDateTime = newStringOrUndefined(result.resolvedDate);
	
		
	// Add meta data
	if (
		result.Last_Updated !== undefined &&
		result.Last_Updated.substring(0, 1) != 'T' &&
		result.Last_Updated.substring(0, 4) != '1900'
	) {
		resource.meta.lastUpdated = result.Last_Updated;
	}

	resource.subject = {
		reference: $cfg('apiUrl') + '/patient/' + result.MRN
	};


	return resource;
}