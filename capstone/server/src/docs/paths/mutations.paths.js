/**
 * Mutations API Path Documentation
 * 
 * OpenAPI/Swagger documentation for mutation endpoints
 */

/**
 * @swagger
 * /api/mutations:
 *   get:
 *     summary: Get all mutations
 *     description: Retrieve a paginated list of mutations with optional filtering
 *     tags: [Mutations]
 *     parameters:
 *       - in: query
 *         name: gene
 *         schema:
 *           type: string
 *         description: Filter by gene symbol (e.g., TP53)
 *         example: TP53
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [missense, nonsense, frameshift, splice, silent]
 *         description: Filter by mutation type
 *       - in: query
 *         name: chromosome
 *         schema:
 *           type: string
 *         description: Filter by chromosome (e.g., chr17)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of mutations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Mutation'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @swagger
 * /api/mutations/stats:
 *   get:
 *     summary: Get mutation statistics
 *     description: Get summary statistics about mutations in the dataset
 *     tags: [Mutations]
 *     responses:
 *       200:
 *         description: Mutation statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalMutations:
 *                   type: integer
 *                   example: 1523
 *                 totalGenes:
 *                   type: integer
 *                   example: 45
 *                 totalSamples:
 *                   type: integer
 *                   example: 200
 *                 mutationTypes:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *                   example:
 *                     missense: 850
 *                     nonsense: 210
 *                     frameshift: 180
 */

/**
 * @swagger
 * /api/mutations/gene/{gene}:
 *   get:
 *     summary: Get mutations for a specific gene
 *     description: Retrieve all mutations for a specific gene, optimized for lollipop plots
 *     tags: [Mutations]
 *     parameters:
 *       - in: path
 *         name: gene
 *         required: true
 *         schema:
 *           type: string
 *         description: Gene symbol
 *         example: TP53
 *     responses:
 *       200:
 *         description: Mutations for the specified gene
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Mutation'
 *       404:
 *         description: Gene not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/mutations/types:
 *   get:
 *     summary: Get mutation type distribution
 *     description: Get the count of each mutation type
 *     tags: [Mutations]
 *     responses:
 *       200:
 *         description: Mutation type distribution
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     example: missense
 *                   count:
 *                     type: integer
 *                     example: 850
 *                   percentage:
 *                     type: number
 *                     example: 55.8
 */

/**
 * @swagger
 * /api/mutations/top-genes:
 *   get:
 *     summary: Get top mutated genes
 *     description: Get genes with the most mutations
 *     tags: [Mutations]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Number of genes to return
 *     responses:
 *       200:
 *         description: Top mutated genes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   gene:
 *                     type: string
 *                     example: TP53
 *                   count:
 *                     type: integer
 *                     example: 245
 *                   types:
 *                     type: object
 *                     additionalProperties:
 *                       type: integer
 */

/**
 * @swagger
 * /api/mutations/lollipop/{gene}:
 *   get:
 *     summary: Get lollipop plot data
 *     description: Get data formatted for lollipop plot visualization including protein domains
 *     tags: [Mutations]
 *     parameters:
 *       - in: path
 *         name: gene
 *         required: true
 *         schema:
 *           type: string
 *         description: Gene symbol
 *         example: TP53
 *     responses:
 *       200:
 *         description: Lollipop plot data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 gene:
 *                   $ref: '#/components/schemas/Gene'
 *                 mutations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       position:
 *                         type: integer
 *                         description: Amino acid position
 *                       aaChange:
 *                         type: string
 *                         example: R248Q
 *                       type:
 *                         type: string
 *                       count:
 *                         type: integer
 *                         description: Number of samples with this mutation
 *                 domains:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProteinDomain'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
