<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\DependencyInjection\Attribute\Value;
use Symfony\Component\Cache\Adapter\RedisAdapter;

final class TestController extends AbstractController
{

    #[Route('/api', name: 'app_test', methods: ['GET'])]
    public function index(): JsonResponse
    {
        return $this->json([
            'message' => 'Welcome to your new controller!',
            'path' => 'src/Controller/TestController.php',
        ]);
    }

    #[Route('/api/param/{id}', methods: ['GET'])]
    public function testParam(int $id): JsonResponse{
        return $this->json([
            'id' => $id
        ]);
    }

        #[Route('/api/redis-test', methods: ['GET'])]
    public function testRedis(): JsonResponse
    {
        try {
            $redis = RedisAdapter::createConnection('redis://redis:6379');
            $cache = new RedisAdapter($redis);
            $item = $cache->getItem('test_key');
            $item->set('Redis fonctionne !');
            $cache->save($item);
            $retrieved = $cache->getItem('test_key')->get();
            return $this->json(['status' => 'OK', 'message' => $retrieved]);
        } catch (\Exception $e) {
            return $this->json(['status' => 'Erreur', 'message' => $e->getMessage()]);
        }
    }
}
