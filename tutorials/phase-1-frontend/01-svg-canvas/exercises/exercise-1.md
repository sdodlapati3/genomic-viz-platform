# Exercise 1: Draw a Protein Domain Diagram

## Objective
Create an SVG visualization of a protein with multiple domains, similar to what you'd see in UniProt or ProteinPaint.

## Requirements

### Basic (Required)
1. Draw a protein backbone as a horizontal rectangle (the full protein length)
2. Add at least 3 different domains as colored rectangles overlaid on the backbone
3. Label each domain with its name
4. Add a title with the protein name

### Intermediate (Recommended)
5. Add amino acid position markers (scale) below the protein
6. Make domains different heights based on their "importance" or type
7. Add a legend explaining the domain colors

### Advanced (Challenge)
8. Add hover tooltips showing domain details (name, position, function)
9. Make domains clickable to show more information
10. Add motifs as smaller markers (diamonds or triangles)

## Sample Data

```javascript
const protein = {
  name: 'TP53',
  length: 393, // amino acids
  domains: [
    { 
      name: 'TAD1', 
      start: 1, 
      end: 40, 
      color: '#e74c3c',
      description: 'Transactivation domain 1'
    },
    { 
      name: 'TAD2', 
      start: 41, 
      end: 61, 
      color: '#e67e22',
      description: 'Transactivation domain 2'  
    },
    { 
      name: 'PRD', 
      start: 64, 
      end: 92, 
      color: '#f1c40f',
      description: 'Proline-rich domain'
    },
    { 
      name: 'DBD', 
      start: 102, 
      end: 292, 
      color: '#3498db',
      description: 'DNA-binding domain'
    },
    { 
      name: 'TD', 
      start: 326, 
      end: 356, 
      color: '#9b59b6',
      description: 'Tetramerization domain'
    },
    { 
      name: 'CTD', 
      start: 364, 
      end: 393, 
      color: '#1abc9c',
      description: 'C-terminal domain'
    }
  ]
};
```

## Hints

1. Use a scale factor to convert amino acid positions to pixel positions:
   ```javascript
   const scale = svgWidth / protein.length;
   const pixelX = aaPosition * scale;
   ```

2. Use SVG `<g>` groups to organize related elements

3. For tooltips, use the `mouseenter` and `mouseleave` events

4. The viewBox attribute helps with responsive sizing:
   ```html
   <svg viewBox="0 0 800 200" width="100%">
   ```

## Expected Output

Your visualization should look something like this:

```
         TP53 Protein Structure
         
[TAD1][TAD2][PRD]    [===== DBD =====]      [TD]  [CTD]
|----|----|----|----|----|----|----|----|
0   50   100  150  200  250  300  350  393
```

## Submission

Create your solution in `solutions/exercise-1.js` and include:
1. The JavaScript code
2. Comments explaining your approach
3. Any CSS needed for styling
