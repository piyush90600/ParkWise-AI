document.addEventListener(
    "DOMContentLoaded",
    async function () {

        const API_BASE_URL =
            "http://127.0.0.1:8000";

        const emptyState =
            document.getElementById(
                "verificationEmpty"
            );

        const content =
            document.getElementById(
                "verificationContent"
            );

        const status =
            document.getElementById(
                "verificationStatus"
            );

        const approveButton =
            document.getElementById(
                "approveOwner"
            );

        const rejectButton =
            document.getElementById(
                "rejectOwner"
            );

        const token =
            localStorage.getItem(
                "access_token"
            );

        if (!token) {

            window.location.replace(
                "admin-login.html"
            );

            return;
        }


        /* =====================================================
           GET SELECTED OWNER ID
           ===================================================== */

        const storedRequest =
            localStorage.getItem(
                "selected_verification"
            );

        let selected = null;

        try {

            selected =
                storedRequest
                    ? JSON.parse(
                        storedRequest
                    )
                    : null;

        } catch (error) {

            console.error(
                "Invalid selected verification:",
                error
            );

        }


        const ownerId =
            selected?.owner_id ||
            selected?.id;


        if (!ownerId) {

            emptyState.style.display =
                "flex";

            content.style.display =
                "none";

            return;
        }


        /* =====================================================
           HELPERS
           ===================================================== */

        function escapeHTML(value) {

            return String(
                value ?? ""
            )
                .replace(
                    /&/g,
                    "&amp;"
                )
                .replace(
                    /</g,
                    "&lt;"
                )
                .replace(
                    />/g,
                    "&gt;"
                )
                .replace(
                    /"/g,
                    "&quot;"
                )
                .replace(
                    /'/g,
                    "&#039;"
                );
        }


        function safeValue(value) {

            if (
                value === undefined ||
                value === null ||
                String(value).trim() === ""
            ) {
                return "—";
            }

            return escapeHTML(value);
        }


        /* =====================================================
           FETCH FRESH DATABASE DATA
           ===================================================== */

        async function loadVerification() {

            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/admin/owners/${encodeURIComponent(
                            ownerId
                        )}`,
                        {
                            method: "GET",

                            headers: {
                                "Authorization":
                                    `Bearer ${token}`
                            }
                        }
                    );


                if (
                    response.status === 401 ||
                    response.status === 403
                ) {

                    localStorage.removeItem(
                        "access_token"
                    );

                    window.location.replace(
                        "admin-login.html"
                    );

                    return;
                }


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.detail ||
                        "Unable to load verification."
                    );
                }


                const request =
                    data.owner;


                renderVerification(
                    request
                );


            } catch (error) {

                console.error(
                    "Verification fetch error:",
                    error
                );

                emptyState.style.display =
                    "flex";

                content.style.display =
                    "none";

                alert(
                    error.message ||
                    "Unable to load verification details."
                );

            }

        }


        /* =====================================================
           RENDER DATA
           ===================================================== */

        function renderVerification(request) {

            emptyState.style.display = "none";
            content.style.display = "block";


            // ==========================================
            // OWNER DETAILS
            // ==========================================

            document.getElementById("ownerId").textContent =
                request.owner_id || request.id || "—";

            document.getElementById("ownerName").textContent =
                request.name ||
                request.owner ||
                "—";

            document.getElementById("ownerEmail").textContent =
                request.email || "—";

            document.getElementById("ownerPhone").textContent =
                request.phone || "—";

            


            // ==========================================
            // DATES
            // ==========================================

            document.getElementById("submittedDate").textContent =
                formatDate(request.submitted);

            document.getElementById("updatedDate").textContent =
                formatDate(request.updated_at);


            // ==========================================
            // STATUS
            // ==========================================

            updateStatusUI(
                request.status
            );


            // ==========================================
            // PARKING LOTS
            // ==========================================

            renderParkingLots(
                request.parking_lots || []
            );


            // ==========================================
            // DOCUMENTS
            // ==========================================

            renderDocuments(
                request.documents || []
            );
        }


        // ==========================================
        // FORMAT DATE
        // ==========================================

        function formatDate(value) {

            if (
                !value ||
                String(value).trim() === ""
            ) {
                return "—";
            }

            const date = new Date(value);

            if (Number.isNaN(date.getTime())) {
                return String(value);
            }

            return date.toLocaleString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );
        }

        // ==========================================
        // RENDER PARKING LOTS
        // ==========================================

        function renderParkingLots(lots) {

            const container =
                document.getElementById(
                    "parkingLotsContainer"
                );

            const noData =
                document.getElementById(
                    "parkingNoData"
                );

            container.innerHTML = "";


            if (
                !Array.isArray(lots) ||
                lots.length === 0
            ) {

                noData.style.display = "flex";

                return;
            }


            noData.style.display = "none";


            lots.forEach(
                (lot, index) => {

                    const card =
                        document.createElement(
                            "div"
                        );

                    card.className =
                        "parking-verification-item";


                    card.innerHTML = `

                        <div class="parking-item-header">

                            <div>

                                <span class="parking-item-number">
                                    Parking Lot ${index + 1}
                                </span>

                                <h3>
                                    ${safeValue(
                                        lot.name
                                    )}
                                </h3>

                            </div>

                            <span class="
                                parking-status
                                ${String(
                                    lot.status || "pending"
                                ).toLowerCase()}
                            ">
                                ${safeValue(
                                    lot.status || "pending"
                                )}
                            </span>

                        </div>


                        <div class="parking-detail-grid">

                            <div>
                                <span>
                                    <i class="fa-solid fa-hashtag"></i>
                                    Parking ID
                                </span>

                                <strong>
                                    ${safeValue(
                                        lot.parking_lots_id
                                    )}
                                </strong>
                            </div>


                            <div>
                                <span>
                                    <i class="fa-solid fa-user"></i>
                                    Owner ID
                                </span>

                                <strong>
                                    ${safeValue(
                                        lot.owner_id
                                    )}
                                </strong>
                            </div>


                            

                            <div>
                                <span>
                                    <i class="fa-solid fa-indian-rupee-sign"></i>
                                    Price / Hour
                                </span>

                                <strong>
                                    ₹${safeValue(
                                        lot.price_per_hour
                                    )}
                                </strong>
                            </div>


                            <div>
                                <span>
                                    <i class="fa-solid fa-car"></i>
                                    Vehicle Type
                                </span>

                                <strong>
                                    ${safeValue(
                                        lot.vehicle_type
                                    )}
                                </strong>
                            </div>


                            <div>
                                <span>
                                    <i class="fa-solid fa-square-parking"></i>
                                    Total Slots
                                </span>

                                <strong>
                                    ${safeValue(
                                        lot.total_slots
                                    )}
                                </strong>
                            </div>


                            <div>
                                <span>
                                    <i class="fa-solid fa-clock"></i>
                                    Operating Hours
                                </span>

                                <strong>
                                    ${safeValue(
                                        lot.timing_start
                                    )}
                                    -
                                    ${safeValue(
                                        lot.timing_end
                                    )}
                                </strong>
                            </div>


                            <div>
                                <span>
                                    <i class="fa-solid fa-location-crosshairs"></i>
                                    Latitude
                                </span>

                                <strong>
                                    ${safeValue(
                                        lot.latitude
                                    )}
                                </strong>
                            </div>


                            <div>
                                <span>
                                    <i class="fa-solid fa-location-crosshairs"></i>
                                    Longitude
                                </span>

                                <strong>
                                    ${safeValue(
                                        lot.longitude
                                    )}
                                </strong>
                            </div>


                            <div>
                                <span>
                                    <i class="fa-solid fa-calendar-plus"></i>
                                    Created At
                                </span>

                                <strong>
                                    ${formatDate(
                                        lot.created_at
                                    )}
                                </strong>
                            </div>

                        </div>

                    `;

                    container.appendChild(
                        card
                    );

                }
            );
        }

        /* =====================================================
           STATUS UI
           ===================================================== */

        function updateStatusUI(
            currentStatus
        ) {

            const normalized =
                String(
                    currentStatus ||
                    "pending"
                ).toLowerCase();


            if (
                normalized === "approved"
            ) {

                status.textContent =
                    "Approved";

                status.className =
                    "status-approved";

            } else if (
                normalized === "rejected"
            ) {

                status.textContent =
                    "Rejected";

                status.className =
                    "status-rejected";

            } else {

                status.textContent =
                    "Pending Review";

                status.className =
                    "status-pending";

            }

        }


        /* =====================================================
           DOCUMENTS
           ===================================================== */

        function renderDocuments(
            documents
        ) {

            const container =
                document.getElementById(
                    "documentsContainer"
                );

            const empty =
                document.getElementById(
                    "documentEmpty"
                );


            if (!documents.length) {

                container.innerHTML =
                    "";

                empty.style.display =
                    "flex";

                return;
            }


            empty.style.display =
                "none";


            container.innerHTML =
                documents.map(
                    function (doc) {

                        const name =
                            doc.filename ||
                            doc.name ||
                            doc.type ||
                            "Document";


                        let url =
                            doc.url ||
                            doc.path ||
                            "#";


                        if (
                            url !== "#" &&
                            !url.startsWith(
                                "http"
                            )
                        ) {

                            url =
                                `${API_BASE_URL}/${url
                                    .replaceAll(
                                        "\\",
                                        "/"
                                    )
                                    .replace(
                                        /^\/+/,
                                        ""
                                    )}`;
                        }


                        return `

                            <a
                                href="${escapeHTML(
                                    url
                                )}"
                                class="document-link"
                                target="_blank"
                                rel="noopener noreferrer"
                            >

                                <span>

                                    <i class="fa-solid fa-file-lines"></i>

                                    ${escapeHTML(
                                        name
                                    )}

                                </span>

                                <i class="fa-solid fa-arrow-up-right-from-square"></i>

                            </a>

                        `;

                    }
                ).join("");

        }


        /* =====================================================
           ACTION BUTTONS
           ===================================================== */

        function configureActions(
            request
        ) {

            const normalizedStatus =
                String(
                    request.status ||
                    "pending"
                ).toLowerCase();


            /* APPROVED => REJECT DISABLED */

            if (
                normalizedStatus ===
                "approved"
            ) {

                approveButton.disabled =
                    true;

                rejectButton.disabled =
                    true;

                approveButton.innerHTML = `
                    <i class="fa-solid fa-circle-check"></i>
                    Approved
                `;

                rejectButton.innerHTML = `
                    <i class="fa-solid fa-lock"></i>
                    Cannot Reject Approved Owner
                `;

                rejectButton.classList.add(
                    "action-disabled"
                );

                return;
            }


            /* REJECTED */

            if (
                normalizedStatus ===
                "rejected"
            ) {

                rejectButton.disabled =
                    true;

                approveButton.disabled =
                    false;

                rejectButton.innerHTML = `
                    <i class="fa-solid fa-circle-xmark"></i>
                    Rejected
                `;

                return;
            }


            /* PENDING */

            approveButton.disabled =
                false;

            rejectButton.disabled =
                false;


            approveButton.onclick =
                () => changeStatus(
                    "approved"
                );

            rejectButton.onclick =
                () => changeStatus(
                    "rejected"
                );

        }


        /* =====================================================
           UPDATE STATUS
           ===================================================== */

        async function changeStatus(
            newStatus
        ) {

            /*
             * Frontend protection
             */

            const currentStatus =
                status.textContent
                    .toLowerCase();


            if (
                currentStatus ===
                "approved" &&
                newStatus ===
                "rejected"
            ) {

                return;
            }


            const confirmed =
                confirm(
                    newStatus === "approved"
                        ? "Are you sure you want to approve this owner?"
                        : "Are you sure you want to reject this owner?"
                );


            if (!confirmed) {
                return;
            }


            approveButton.disabled =
                true;

            rejectButton.disabled =
                true;


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/admin/owners/${encodeURIComponent(
                            ownerId
                        )}/status?status=${encodeURIComponent(
                            newStatus
                        )}`,
                        {
                            method: "PATCH",

                            headers: {
                                "Authorization":
                                    `Bearer ${token}`
                            }
                        }
                    );


                const data =
                    await response.json()
                        .catch(
                            () => ({})
                        );


                if (!response.ok) {

                    throw new Error(
                        data.detail ||
                        "Unable to update owner status."
                    );
                }


                updateStatusUI(
                    newStatus
                );


                if (
                    newStatus ===
                    "approved"
                ) {

                    approveButton.innerHTML = `
                        <i class="fa-solid fa-circle-check"></i>
                        Approved
                    `;

                    rejectButton.innerHTML = `
                        <i class="fa-solid fa-lock"></i>
                        Cannot Reject Approved Owner
                    `;

                    rejectButton.classList.add(
                        "action-disabled"
                    );

                } else {

                    rejectButton.innerHTML = `
                        <i class="fa-solid fa-circle-xmark"></i>
                        Rejected
                    `;

                }


                configureActions({
                    status: newStatus
                });


            } catch (error) {

                console.error(
                    error
                );

                alert(
                    error.message ||
                    "Failed to update verification."
                );

                approveButton.disabled =
                    false;

                rejectButton.disabled =
                    false;

            }

        }


        await loadVerification();

    }
);

// ==========================================
// RENDER DOCUMENTS
// ==========================================

function renderDocuments(documents) {

    const container =
        document.getElementById(
            "documentsContainer"
        );

    const empty =
        document.getElementById(
            "documentEmpty"
        );

    container.innerHTML = "";


    if (
        !Array.isArray(documents) ||
        documents.length === 0
    ) {

        empty.style.display = "flex";

        return;
    }


    empty.style.display = "none";


    documents.forEach(
        (documentItem, index) => {

            const wrapper =
                document.createElement(
                    "div"
                );

            wrapper.className =
                "verification-document";


            const name =
                typeof documentItem === "string"
                    ? documentItem
                    : (
                        documentItem.name ||
                        documentItem.filename ||
                        `Document ${index + 1}`
                    );


            const url =
                typeof documentItem === "object"
                    ? (
                        documentItem.url ||
                        documentItem.path ||
                        "#"
                    )
                    : "#";


            wrapper.innerHTML = `

                <div class="document-icon">
                    <i class="fa-solid fa-file-lines"></i>
                </div>

                <div class="document-info">

                    <strong>
                        ${safeValue(name)}
                    </strong>

                    <span>
                        Submitted verification document
                    </span>

                </div>

                ${
                    url !== "#"
                    ? `
                        <a
                            href="${escapeHTML(url)}"
                            target="_blank"
                            class="document-view"
                        >
                            <i class="fa-solid fa-eye"></i>
                            View
                        </a>
                    `
                    : ""
                }

            `;

            container.appendChild(
                wrapper
            );

        }
    );
}