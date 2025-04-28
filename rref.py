import math
import copy

# A small tolerance for floating-point comparisons
EPSILON = 1e-9

def get_matrix_from_user():
    """Gets matrix dimensions and elements from user input."""
    while True:
        try:
            rows = int(input("Enter the number of rows: "))
            cols = int(input("Enter the number of columns: "))
            if rows > 0 and cols > 0:
                break
            else:
                print("Rows and columns must be positive integers.")
        except ValueError:
            print("Invalid input. Please enter integers for dimensions.")

    print(f"\nEnter the matrix elements row by row.")
    print(f"Separate elements in a row with spaces.")
    matrix = []
    for i in range(rows):
        while True:
            try:
                row_str = input(f"Row {i + 1}: ")
                row = [float(x) for x in row_str.split()]
                if len(row) == cols:
                    matrix.append(row)
                    break
                else:
                    print(f"Error: Row must have exactly {cols} elements. You entered {len(row)}.")
            except ValueError:
                print("Invalid input. Please enter numbers separated by spaces.")
            except Exception as e:
                print(f"An unexpected error occurred: {e}")
    return matrix

def print_matrix(matrix, title="Matrix"):
    """Prints the matrix in a formatted way."""
    if not matrix:
        print(f"{title}: Empty Matrix")
        return

    print(f"\n--- {title} ---")
    rows = len(matrix)
    cols = len(matrix[0])

    # Find max width for each column for alignment (optional but nice)
    col_widths = [0] * cols
    for r in range(rows):
        for c in range(cols):
            # Format number nicely, handle potential -0.0
            num_str = f"{matrix[r][c]:.3f}".replace("-0.000", " 0.000")
            col_widths[c] = max(col_widths[c], len(num_str))

    # Print formatted matrix
    for r in range(rows):
        row_str = "[ "
        for c in range(cols):
             # Format number nicely, handle potential -0.0
            num_str = f"{matrix[r][c]:.3f}".replace("-0.000", " 0.000")
            # Right-align numbers in their column width
            row_str += f"{num_str:>{col_widths[c]}}  "
        row_str += "]"
        print(row_str)
    print("-" * (sum(col_widths) + 3 * cols + 4)) # Adjust separator length


def rref(matrix):
    """
    Calculates the Reduced Row Echelon Form (RREF) of a matrix
    using Gauss-Jordan elimination.

    Args:
        matrix: A list of lists representing the matrix (numbers).

    Returns:
        A new list of lists representing the RREF of the input matrix.
        Returns an empty list if the input matrix is empty.
    """
    if not matrix or not matrix[0]:
        return []

    # Work on a copy to avoid modifying the original matrix
    mat = copy.deepcopy(matrix)
    rows = len(mat)
    cols = len(mat[0])
    pivot_row = 0 # Keep track of the current row we are placing a pivot in

    # --- Forward Pass (Gaussian Elimination -> Echelon Form) ---
    for c in range(cols):
        if pivot_row >= rows:
            break # No more rows to process

        # Find pivot: Find the first row (at or below pivot_row)
        # with a non-zero entry in the current column 'c'
        i = pivot_row
        while i < rows and abs(mat[i][c]) < EPSILON:
            i += 1

        if i < rows: # Pivot found at row 'i'
            # Swap row 'i' with 'pivot_row' to bring the pivot up
            if i != pivot_row:
                mat[i], mat[pivot_row] = mat[pivot_row], mat[i]

            # Normalize pivot row: Divide the pivot row by the pivot element
            # to make the pivot element 1
            pivot_val = mat[pivot_row][c]
            if abs(pivot_val) > EPSILON: # Avoid division by zero/very small number
                 mat[pivot_row] = [elem / pivot_val for elem in mat[pivot_row]]
                 # Correct potential -0.0 issues after division
                 for k in range(cols):
                     if abs(mat[pivot_row][k]) < EPSILON:
                         mat[pivot_row][k] = 0.0


            # Eliminate other entries below the pivot in the current column:
            # For each row below the pivot row, subtract a multiple
            # of the pivot row to make the entry in column 'c' zero.
            for r in range(rows):
                if r != pivot_row:
                    factor = mat[r][c]
                    if abs(factor) > EPSILON: # Only subtract if needed
                        mat[r] = [mat[r][k] - factor * mat[pivot_row][k] for k in range(cols)]
                        # Correct potential -0.0 issues after subtraction
                        for k in range(cols):
                            if abs(mat[r][k]) < EPSILON:
                                mat[r][k] = 0.0

            pivot_row += 1 # Move to the next row for the next pivot

    # --- Backward Pass (Jordan Elimination -> Reduced Echelon Form) ---
    # Now iterate backwards from the last potential pivot row
    # The pivot_row variable now holds the index *after* the last row used for a pivot
    for r_pivot in range(pivot_row - 1, -1, -1):
        # Find the pivot column (the first non-zero element) in this row
        pivot_col = -1
        for c in range(cols):
            if abs(mat[r_pivot][c] - 1.0) < EPSILON: # Pivot should be 1
                 # Check if it's the *only* non-zero in its column *above* this row
                 is_pivot = True
                 for r_check in range(r_pivot):
                     if abs(mat[r_check][c]) > EPSILON:
                         # This check is actually handled by the elimination below
                         pass # We will eliminate elements above anyway
                 pivot_col = c
                 break # Found the pivot column for this row

        if pivot_col != -1:
            # Eliminate elements *above* the pivot in the pivot_col
            for r_above in range(r_pivot):
                factor = mat[r_above][pivot_col]
                if abs(factor) > EPSILON: # Only subtract if needed
                    mat[r_above] = [mat[r_above][k] - factor * mat[r_pivot][k] for k in range(cols)]
                    # Correct potential -0.0 issues after subtraction
                    for k in range(cols):
                        if abs(mat[r_above][k]) < EPSILON:
                            mat[r_above][k] = 0.0

    # Final clean up for near-zero values that might remain
    for r in range(rows):
        for c in range(cols):
            if abs(mat[r][c]) < EPSILON:
                mat[r][c] = 0.0

    return mat

def main():
    try:
        print("Matrix RREF Calculator")
        print("=" * 22)

        original_matrix = get_matrix_from_user()

        if original_matrix:
            print_matrix(original_matrix, "Original Matrix")
            rref_matrix = rref(original_matrix)
            print_matrix(rref_matrix, "Reduced Row Echelon Form (RREF)")
        else:
            print("No matrix entered.")

    except KeyboardInterrupt:
        print("\nCalculation cancelled by user.")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")

if __name__ == "__main__":
    main()