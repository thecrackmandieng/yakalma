# TODO - Yakalma Backend

## ✅ Completed Tasks

### Table Management Endpoints
- [x] Create Table model (models/Table.js)
- [x] Update Restaurant model to include tables array
- [x] Install qrcode package for QR code generation
- [x] Add createTable function in restaurantController.js
- [x] Add getTables function in restaurantController.js
- [x] Add deleteTable function in restaurantController.js
- [x] Add POST /tables route for creating tables
- [x] Add GET /tables route for retrieving tables
- [x] Add DELETE /tables/:id route for deleting tables
- [x] Test create table endpoint - ✅ Works
- [x] Test get tables endpoint - ❌ Error (needs debugging)
- [x] Test delete table endpoint - ✅ Works

## 🔄 In Progress

### Table Management Debugging
- [ ] Debug getTables endpoint - currently returns "Erreur serveur."
- [ ] Verify Table model import and usage
- [ ] Check database queries in getTables function

## 📋 Pending Tasks

### Additional Features
- [ ] Add table update endpoint (PUT /tables/:id)
- [ ] Add table status management (active/inactive)
- [ ] Add QR code regeneration endpoint
- [ ] Add table statistics endpoint

### Testing & Validation
- [ ] Comprehensive testing of all table endpoints
- [ ] Error handling validation
- [ ] Authentication and authorization testing
- [ ] Database relationship validation

### Documentation
- [ ] API documentation for table endpoints
- [ ] Update README with table management features

## 🐛 Known Issues

### getTables Endpoint
- Returns "Erreur serveur." instead of table list
- Need to investigate console logs for specific error
- Possible issues: Table model import, database query, or response formatting

### Frontend Integration
- Ensure frontend can consume the QR code data URLs
- Verify table ID generation matches frontend expectations
