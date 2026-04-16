(() => {
   let isSelecting = false;
   let selectedCells = new Set();
   let startCell = null;

   function getTableCells(table) {
      return Array.from(table.querySelectorAll("td, th"));
   }

   function getCellCoords(cell) {
      const row = cell.parentElement;
      const table = row.closest("table");
      if (!table) return null;

      const rows = Array.from(table.querySelectorAll("tr"));
      const rowIndex = rows.indexOf(row);
      const colIndex = Array.from(row.children).indexOf(cell);
      return { table, rowIndex, colIndex };
   }

   function clearSelection() {
      selectedCells.forEach((cell) => cell.classList.remove("tcs-selected"));
      selectedCells.clear();
   }

   function deselectCell(cell) {
      cell.classList.remove("tcs-selected");
      selectedCells.delete(cell);
   }

   function selectRange(from, to) {
      clearSelection();

      const coordsFrom = getCellCoords(from);
      const coordsTo = getCellCoords(to);
      if (!coordsFrom || !coordsTo || coordsFrom.table !== coordsTo.table) return;

      const table = coordsFrom.table;
      const rows = Array.from(table.querySelectorAll("tr"));

      const minRow = Math.min(coordsFrom.rowIndex, coordsTo.rowIndex);
      const maxRow = Math.max(coordsFrom.rowIndex, coordsTo.rowIndex);
      const minCol = Math.min(coordsFrom.colIndex, coordsTo.colIndex);
      const maxCol = Math.max(coordsFrom.colIndex, coordsTo.colIndex);

      for (let r = minRow; r <= maxRow; r++) {
         const cells = Array.from(rows[r].children);
         for (let c = minCol; c <= maxCol; c++) {
            if (c < cells.length) {
               cells[c].classList.add("tcs-selected");
               selectedCells.add(cells[c]);
            }
         }
      }
   }

   function checkAllCheckboxesInSelection() {
      selectedCells.forEach((cell) => {
         const checkboxes = cell.querySelectorAll('input[type="checkbox"]');
         checkboxes.forEach((cb) => {
            if (!cb.checked) {
               cb.checked = true;
               cb.dispatchEvent(new Event("change", { bubbles: true }));
               cb.dispatchEvent(new Event("click", { bubbles: true }));
            }
         });
      });
   }

   function buildCopyText() {
      if (selectedCells.size === 0) return "";

      const cellArray = Array.from(selectedCells);
      const table = cellArray[0].closest("table");
      if (!table) return "";

      const rows = Array.from(table.querySelectorAll("tr"));
      const lines = [];

      for (const row of rows) {
         const cells = Array.from(row.children);
         const rowTexts = [];
         for (const cell of cells) {
            if (selectedCells.has(cell)) {
               rowTexts.push(cell.innerText.trim());
            }
         }
         if (rowTexts.length > 0) {
            lines.push(rowTexts.join("\t"));
         }
      }

      return lines.join("\n");
   }

   document.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;

      const cell = e.target.closest("td, th");

      // Clicked outside any table cell — deselect all
      if (!cell) {
         clearSelection();
         return;
      }

      // Shift+click inside a selected cell — check all checkboxes in selection
      if (e.shiftKey && selectedCells.has(cell)) {
         e.preventDefault();
         checkAllCheckboxesInSelection();
         return;
      }

      // Only start selection when Ctrl is held
      if (!e.ctrlKey && !e.metaKey) return;

      // Clicked an already-selected cell — deselect it
      if (selectedCells.has(cell)) {
         deselectCell(cell);
         startCell = null;
         return;
      }

      // Start a new drag selection
      isSelecting = true;
      startCell = cell;
      clearSelection();
      cell.classList.add("tcs-selected");
      selectedCells.add(cell);

      e.preventDefault();
   });

   document.addEventListener("mouseover", (e) => {
      if (!isSelecting || !startCell) return;

      const cell = e.target.closest("td, th");
      if (!cell) return;

      selectRange(startCell, cell);
   });

   document.addEventListener("mouseup", () => {
      isSelecting = false;
   });

   document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedCells.size > 0) {
         e.preventDefault();
         const text = buildCopyText();
         navigator.clipboard.writeText(text).then(() => {
            console.log("Table cells copied to clipboard.");
         });
      }
   });
})();