module documentmanagement::documentmanagement {
    use sui::table::{Self, Table};
    use sui::event;
    use std::string::String;

    // Error codes
    const EUnauthorizedApprover: u64 = 2;
    const EInvalidStatus: u64 = 3;

    // Document struct
    public struct Document has key, store {
        id: UID,
        creator: address,
        current_approver: address,
        content_hash: String,
        approval_history: vector<address>,
        status: u8, // 0: Created, 1: Waiting Approval, 2: Completed
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

    // Initialize the system (creates DocumentStore)
    fun init(ctx: &mut TxContext) {
        // Initialize DocumentStore
        let store = DocumentStore {
            id: object::new(ctx),
            documents: table::new(ctx),
            next_id: 0,
        };
        transfer::share_object(store);
    }

    // Create a new document
    public entry fun create_document(
        store: &mut DocumentStore,
        content_hash: String,
        first_approver: address,
        ctx: &mut TxContext
    ) {
        let creator = tx_context::sender(ctx);

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
        document_id: u64,
        mut next_approver: Option<address>,
        ctx: &mut TxContext
    ) {
        let approver = tx_context::sender(ctx);

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


    // Approve a document
    public entry fun approve_completed_document(
        store: &mut DocumentStore,
        document_id: u64,
        ctx: &mut TxContext
    ) {
        let approver = tx_context::sender(ctx);

        let document = table::borrow_mut(&mut store.documents, document_id);

        // Check if the approver is authorized to approve this document
        assert!(document.current_approver == approver, EUnauthorizedApprover);

        // Check if the document is in "Waiting Approval" status
        assert!(document.status == 1, EInvalidStatus);

        // Add approver to approval history
        vector::push_back(&mut document.approval_history, approver);

        // Handle next approver or complete the document

            document.status = 2; // Completed

        // Emit event for document approval
        event::emit(DocumentApprovedEvent {
            doc_id: document_id,
            approver,
            next_approver: option::none(),
            completed:true,
        });
    }


    // Utility function to get document status (for off-chain queries)
    public fun get_document_status(store: &DocumentStore, document_id: u64): u8 {
        let document = table::borrow(&store.documents, document_id);
        document.status
    }

    // Utility functiostd::option:n to get document approval history (for off-chain queries)
    public fun get_approval_history(store: &DocumentStore, document_id: u64): &vector<address> {
        let document = table::borrow(&store.documents, document_id);
        &document.approval_history
    }
}