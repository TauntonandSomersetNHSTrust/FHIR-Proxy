/**
	Builds Procedure FHIR Resource that adheres to its Care-Connect profile,
	see https://fhir.hl7.org.uk/STU3/StructureDefinition/CareConnect-Procedure-1 for more info.

	@author Julian Matthews
	@param {Object} data - Java RowSet object.
	@return {Object} Flag FHIR resource.
 */
function buildFlagResource(data) {
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
	result.Last_Updated != undefined &&
	result.Last_Updated.substring(0, 1) != 'T' && 
	result.Last_Updated.substring(0, 1) != '1900'
	) {
		resource.meta.lastUpdated = newStringOrUndefined(result.Last_Updated);
	}
	resource.id = newStringOrUndefined(result.procedureID);
	resource.status = newStringOrUndefined(result.status);

	//Add coded Procedure name
	//
	//Array structure should be:
	//system,code,display|system,code,display|system,code,display


	resource.code = {
		coding: []
	};
	if(result.proceduretype != undefined) {
		const procedureSplit = result.proceduretype.split('\\|');
		for(var i = 0; i < procedureSplit.length; i++) {
			var procedureArray = procedureSplit[i].toString();
			var components = procedureArray.split('\\,');
			var procedurecode = {
				system: newStringOrUndefined(components[0]),
				code: newStringOrUndefined(components[1]),
				display: newStringOrUndefined(components[2])
			};
			resource.code.coding.push(procedurecode);
		}
	} else {}
	
	//Datetime of procedure
	resource.performedDateTime = newStringOrUndefined(result.procedureDatetime);
	
	resource.performer = [];
	var emptyPerformer = {
		actor: {
			//reference: undefined, //could include link to practicioner resource in future
			display: newStringOrUndefined(result.clinicanName)
		}
	};
	resource.performer.push(emptyPerformer);
	resource.note = [];
	var emptyNote = {
		text: newStringOrUndefined(result.procedureNote)
	};
	resource.note.push(emptyNote);
	resource.subject = {
		reference: $cfg('apiUrl') + '/patient/' + result.MRN
	};
	return resource;
}