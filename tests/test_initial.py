import pytest
from starter import sudoku_logic


def count_clues(board):
    return sum(1 for row in board for cell in row if cell != sudoku_logic.EMPTY)


def is_valid_board(board):
    size = sudoku_logic.SIZE
    expected = set(range(1, size + 1))

    for row in board:
        if set(row) != expected:
            return False

    for col in range(size):
        if set(board[row][col] for row in range(size)) != expected:
            return False

    for box_row in range(0, size, 3):
        for box_col in range(0, size, 3):
            box_cells = [
                board[r][c]
                for r in range(box_row, box_row + 3)
                for c in range(box_col, box_col + 3)
            ]
            if set(box_cells) != expected:
                return False

    return True


def test_is_safe_detects_invalid_placements():
    board = sudoku_logic.create_empty_board()
    board[0][0] = 5
    board[0][1] = 3
    board[1][0] = 6

    assert not sudoku_logic.is_safe(board, 0, 2, 5)
    assert not sudoku_logic.is_safe(board, 2, 0, 5)
    assert not sudoku_logic.is_safe(board, 1, 1, 3)
    assert sudoku_logic.is_safe(board, 2, 2, 4)


def test_fill_board_produces_valid_complete_board():
    board = sudoku_logic.create_empty_board()
    assert sudoku_logic.fill_board(board)
    assert is_valid_board(board)


def test_generate_puzzle_returns_requested_clues():
    clues = 35
    puzzle, solution = sudoku_logic.generate_puzzle(clues)

    assert count_clues(puzzle) == clues
    assert is_valid_board(solution)
    assert len(puzzle) == sudoku_logic.SIZE
    assert len(solution) == sudoku_logic.SIZE
    assert all(len(row) == sudoku_logic.SIZE for row in puzzle)
    assert all(len(row) == sudoku_logic.SIZE for row in solution)
