// Shared column template so session rows, subsession rows, and the table header
// all line up: chevron | time | program | speakers | actions | grip. The chevron
// column mirrors the day banner's layout (collapse control on the far left);
// only session rows use it — subsession/flight rows just leave it empty.
export const ROW_GRID = "grid grid-cols-[20px_88px_minmax(240px,1fr)_360px_128px_26px]";

// Same template but with the program/people split reversed: the program
// column is pinned to just enough width for the longest flight no./route
// text to never wrap, and the people column (now the flexible track) absorbs
// the rest — giving it the bulk of the row (~60%+) for passenger chips.
export const ROW_GRID_LOGISTICS = "grid grid-cols-[20px_88px_300px_minmax(400px,1fr)_128px_26px]";
