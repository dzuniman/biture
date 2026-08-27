<?php

declare(strict_types=1);

final class Application
{
    private const RESOURCE_TYPES = [
        'clients' => [ClientRepository::class, ClientService::class],
        'products' => [ProductRepository::class, ProductService::class],
        'quoteuoms' => [QuoteUomRepository::class, QuoteUomService::class],
        'users' => [UserRepository::class, UserService::class],
        'quotes' => [QuoteRepository::class, QuoteService::class],
        'invoices' => [InvoiceRepository::class, InvoiceService::class],
        'jobcards' => [JobCardRepository::class, JobCardService::class],
        'deliverynotes' => [DeliveryNoteRepository::class, DeliveryNoteService::class],
        'creditnotes' => [CreditNoteRepository::class, CreditNoteService::class],
        'costs' => [CostRepository::class, CostService::class],
        'statements' => [StatementRepository::class, StatementService::class],
        'tools' => [ToolRepository::class, ToolService::class],
        'documents' => [DocumentRepository::class, DocumentService::class],
        'folders' => [DocumentFolderRepository::class, DocumentFolderService::class],
    ];

    public static function controller(Container $container, string $type, PDO $pdo, string $table, string $resource): ResourceController
    {
        [$repositoryType, $serviceType] = self::RESOURCE_TYPES[$resource] ?? [PdoResourceRepository::class, ResourceService::class];
        $repositoryKey = $repositoryType . ':' . $resource;
        $serviceKey = $serviceType . ':' . $resource;
        $container->singleton($repositoryKey, fn(): ResourceRepositoryInterface => new $repositoryType($pdo, $table, $resource));
        $container->singleton($serviceKey, fn(Container $app): ResourceService => new $serviceType($app->get($repositoryKey)));
        return new $type($pdo, $table, $resource, $container->get($serviceKey));
    }
}