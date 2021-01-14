/**
	Queries database for data needed to build FHIR resource.

	@author Julian Matthews
	@param {string} type - Resource name.
	@param {string} SPQuery - String containing the parameters for the stored procedure.
	@param {string} reqtype - String containing the request type to determin which stored procedure should be used (Read vs Search etc).
	@return {Object} Java ResultSet object.
 */
function buildResourceQuery(type, SPQuery, reqtype) {
	var API = configurationMap.get('apiKey');
	switch(''.concat(type)) {
		case 'allergyintolerance':
			return executeCachedQuery();
		case 'condition':
			switch(''.concat(reqtype)) {
				case 'search':
					return executeCachedQuery("EXECUTE [dbo].[sp_FHIR_IMS_Conditions] @apiKey = '" + API + "', " + SPQuery);
				case 'read':
					return executeCachedQuery("EXECUTE [dbo].[sp_FHIR_IMS_Condition_Read] @apiKey = '" + API + "', " + SPQuery);
			}
		case 'documentreference':
			return executeCachedQuery();
		case 'encounter':
			switch(''.concat(reqtype)) {
				case 'search':
					return executeCachedQuery("EXECUTE [dbo].[sp_FHIR_IMS_Encounter] @apiKey = '" + API + "', " + SPQuery);
				case 'read':
					return executeCachedQuery("EXECUTE [dbo].[sp_FHIR_IMS_Encounter_Read] @apiKey = '" + API + "', " + SPQuery);
			}
		case 'flag':
			switch(''.concat(reqtype)) {
				case 'search':
					return executeCachedQuery("EXECUTE [dbo].[sp_FHIR_IMS_Flags] @apiKey = '" + API + "', " + SPQuery);
				case 'read':
					return executeCachedQuery("EXECUTE [dbo].[sp_FHIR_IMS_Flag_Read] @apiKey = '" + API + "', " + SPQuery);
			}
		case 'procedure':
			switch(''.concat(reqtype)) {
				case 'search':
					return executeCachedQuery("EXECUTE [dbo].[sp_FHIR_IMS_Procedures] @apiKey = '" + API + "', " + SPQuery);
				case 'read':
					return executeCachedQuery();
			}
		case 'medicationstatement':
			switch(''.concat(reqtype)) {
				case 'search':
					return executeCachedQuery();
				case 'read':
					return executeCachedQuery();
			}
		case 'patient':
			switch(''.concat(reqtype)) {
				case 'search':
					return executeCachedQuery("EXECUTE [dbo].[sp_FHIR_IMS_Patient] @apiKey = '" + API + "', " + SPQuery);
				case 'read':
					return executeCachedQuery("EXECUTE [dbo].[sp_FHIR_IMS_Patient_MRN] @apiKey = '" + API + "', " + SPQuery);
			}
		default:
			break;
	}
}