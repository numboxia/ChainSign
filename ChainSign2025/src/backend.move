module documentmanagement::documentmanagement {
    use sui::table::{Self, Table};
    use sui::event;

    // Error codes
    const ENotEmployee: u64 = 1;
    const EUnauthorizedApprover: u64 = 2;
    const EInvalidStatus: u64 = 3;
    const ENotAdmin: u64 = 4;

    // Employee struct
    public struct Employee has key, store {
        id: UID,
        wallet: address,
    }

    // Document struct
    public struct Document has key, store {
        id: UID,
        creator: address,
        current_approver: address,
        content_hash: vector<u8>,
        approval_history: vector<address>,
        status: u8, // 0: Created, 1: Waiting Approval, 2: Completed
    }

    // Employee registry to store company employees
    public struct EmployeeRegistry has key {
        id: UID,
        admin: address,
        employees: Table<address, Employee>,
    }

    // Document store to hold documents
    public struct DocumentStore has key {
        id: UID,
        documents: Table<u64, Document>,
        next_id: u64,
    }

    // Events for off-chain tracking
    public struct DocumentCreatedEvent has copy, drop {
        doc_id: u64,
        creator: address,
        first_approver: address,
    }

    public struct DocumentApprovedEvent has copy, drop {
        doc_id: u64,
        approver: address,
        next_approver: Option<address>,
        completed: bool,
    }

    // Initialize the system (creates EmployeeRegistry and DocumentStore
    fun init(ctx: &mut TxContext) {
        let admin = tx_context::sender(ctx);

        // Initialize EmployeeRegistry
        let registry = EmployeeRegistry {
            id: object::new(ctx),
            admin,
            employees: table::new(ctx),
        };
        transfer::share_object(registry);

        // Initialize DocumentStore
        let store = DocumentStore {
            id: object::new(ctx),
            documents: table::new(ctx),
            next_id: 0,
        };
        transfer::share_object(store);
    }

    // Add a new employee (admin only)
    public entry fun add_employee(
        registry: &mut EmployeeRegistry,
        employee_address: address,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == registry.admin, ENotAdmin);

        let employee = Employee {
            id: object::new(ctx),
            wallet: employee_address,
        };
        table::add(&mut registry.employees, employee_address, employee);
    }

    // Create a new document
    public entry fun create_document(
        store: &mut DocumentStore,
        registry: &EmployeeRegistry,
        content_hash: vector<u8>,
        first_approver: address,
        ctx: &mut TxContext
    ) {
        let creator = tx_context::sender(ctx);

        // Check if creator is an employee
        assert!(table::contains(&registry.employees, creator), ENotEmployee);

        // Check if first approver is an employee
        assert!(table::contains(&registry.employees, first_approver), ENotEmployee);

        // Generate document ID
        let doc_id = store.next_id;
        store.next_id = doc_id + 1;

        let document = Document {
            id: object::new(ctx),
            creator,
            current_approver: first_approver,
            content_hash,
            approval_history: vector::empty(),
            status: 1, // Waiting Approval
        };

        table::add(&mut store.documents, doc_id, document);

        // Emit event for document creation
        event::emit(DocumentCreatedEvent {
            doc_id,
            creator,
            first_approver,
        });
    }

    // Approve a document
    public entry fun approve_document(
        store: &mut DocumentStore,
        registry: &EmployeeRegistry,
        document_id: u64,
        mut next_approver: Option<address>,
        ctx: &mut TxContext
    ) {
        let approver = tx_context::sender(ctx);

        // Check if approver is an employee
        assert!(table::contains(&registry.employees, approver), ENotEmployee);

        let document = table::borrow_mut(&mut store.documents, document_id);

        // Check if the approver is authorized to approve this document
        assert!(document.current_approver == approver, EUnauthorizedApprover);

        // Check if the document is in "Waiting Approval" status
        assert!(document.status == 1, EInvalidStatus);

        // Add approver to approval history
        vector::push_back(&mut document.approval_history, approver);

        let mut completed = false;

        // Handle next approver or complete the document
        if (option::is_some(&next_approver)) {
            let next = option::extract(&mut next_approver);
            // Check if next approver is an employee
            assert!(table::contains(&registry.employees, next), ENotEmployee);
            document.current_approver = next;
        } else {
            document.status = 2; // Completed
            completed = true;
        };

        // Emit event for document approval
        event::emit(DocumentApprovedEvent {
            doc_id: document_id,
            approver,
            next_approver,
            completed,
        });
    }

    // Utility function to get document status (for off-chain queries)
    public fun get_document_status(store: &DocumentStore, document_id: u64): u8 {
        let document = table::borrow(&store.documents, document_id);
        document.status
    }

    // Utility function to get document approval history (for off-chain queries)
    public fun get_approval_history(store: &DocumentStore, document_id: u64): &vector<address> {
        let document = table::borrow(&store.documents, document_id);
        &document.approval_history
    }
}



public entry fun store_document_hash(
    store: &mut DocumentStore,
    document_id: u64,
    ipfs_hash: vector<u8>,
    ctx: &mut TxContext
) {
    let document = table::borrow_mut(&mut store.documents, document_id);

    // Store the IPFS hash
    document.content_hash = ipfs_hash;

    // Emit an event for off-chain tracking
    event::emit(DocumentCreatedEvent {
        doc_id: document_id,
        creator: document.creator,
        first_approver: document.current_approver,
    });
}