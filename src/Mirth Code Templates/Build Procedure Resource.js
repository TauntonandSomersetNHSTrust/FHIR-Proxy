/**
	Builds Procedure FHIR Resource that adheres to its Care-Connect profile,
	see https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Procedure-1 for more info.

	@author Julian Matthews
	@param {Object} data - Java RowSet object.
	@return {Object} Flag FHIR resource.
 */
function buildProcedureResource(data) {
	var result = getResultSet(data);
	/**
	 * Hard-coding meta profile and resourceType into resource as this should not
	 * be changed for this resource, ever.
	 */
	var resource = {
		meta: {
			profile: ['https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Procedure-1']
		},
		resourceType: 'Procedure'
	};
	// Add meta data
	if(
	result.Last_Updated &&
	result.Last_Updated.substring(0, 1) != 'T' && 
	result.Last_Updated.substring(0, 1) != '1900'
	) {
		resource.meta.lastUpdated = newStringOrUndefined(result.Last_Updated);
	}
	resource.id = newStringOrUndefined(result.patientProcedureID);

	resource.code = {
		coding: []
	};
	var procedurecode = {
		system: newStringOrUndefined('https://fhir.nhs.uk/Id/opcs-4'),
		code: newStringOrUndefined(result.OPCS4),
		display: newStringOrUndefined(result.performedProcs)
	};
	
	resource.code.coding.push(procedurecode);
	
	//Datetime of procedure
	resource.performedDateTime = newStringOrUndefined(result.performedOn);
	
	resource.performer = [];
	var emptyPerformer = {
		actor: {
			//reference: undefined, //could include link to practicioner resource in future
			display: newStringOrUndefined(result.operatingSurgeon)
		}
	};
	resource.performer.push(emptyPerformer);

	resource.subject = {
		reference: $cfg('apiUrl') + '/patient/' + result.MRN
	};
	return resource;
}