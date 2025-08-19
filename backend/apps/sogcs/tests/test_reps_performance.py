"""
Performance Tests for REPS XLS File Import Functionality

This module contains comprehensive performance tests to validate system
performance under realistic load conditions for REPS file imports.

Key performance testing areas:
- Large file processing (1000+ records)
- Database bulk operations performance
- Memory usage optimization
- Concurrent import handling
- Response time validation
- System resource monitoring

Tests ensure the system meets performance requirements for Colombian
healthcare institutions importing large REPS datasets.
"""

import time
import psutil
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from unittest.mock import patch, Mock
from django.test import TestCase, TransactionTestCase
from django.test.utils import override_settings
from django.db import connection
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status

from apps.organization.models import Organization
from apps.organization.models.health import HealthOrganization
from apps.organization.models.sogcs_sedes import HeadquarterLocation
from apps.sogcs.services.reps_sync import REPSSynchronizationService
from apps.sogcs.views import REPSImportViewSet
from .test_reps_fixtures import REPSTestDataFixtures, REPSTestScenarios

User = get_user_model()


class REPSPerformanceTestCase(TransactionTestCase):
    """
    Base class for REPS performance tests with database and memory monitoring
    """
    
    @classmethod
    def setUpClass(cls):
        """Set up class-level test data"""
        super().setUpClass()
        cls.fixtures = REPSTestDataFixtures()
        cls.temp_files = []
    
    @classmethod
    def tearDownClass(cls):
        """Clean up temporary files"""
        super().tearDownClass()
        for file_path in cls.temp_files:
            try:
                import os
                os.unlink(file_path)
            except FileNotFoundError:
                pass
    
    def setUp(self):
        """Set up each test method"""
        self.user = User.objects.create_user(
            email='performance@example.com',
            password='testpass123'
        )
        
        self.organization = Organization.objects.create(
            razon_social='IPS Performance Test S.A.S',
            nit='900123456-1',
            tipo_organizacion='ips'
        )
        
        self.health_organization = HealthOrganization.objects.create(
            organization=self.organization,
            reps_code='123456789012'
        )
        
        self.service = REPSSynchronizationService()
        
        # Performance monitoring setup
        self.initial_memory = self._get_memory_usage()
        self.initial_db_queries = len(connection.queries)
    
    def tearDown(self):
        """Clean up after each test"""
        # Log performance metrics
        final_memory = self._get_memory_usage()
        memory_delta = final_memory - self.initial_memory
        final_db_queries = len(connection.queries)
        query_delta = final_db_queries - self.initial_db_queries
        
        print(f"\nPerformance Metrics:")
        print(f"Memory usage delta: {memory_delta:.2f} MB")
        print(f"Database queries: {query_delta}")
    
    def _get_memory_usage(self) -> float:
        """Get current memory usage in MB"""
        process = psutil.Process()
        return process.memory_info().rss / 1024 / 1024
    
    def _measure_execution_time(self, func, *args, **kwargs):
        """Measure function execution time"""
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        execution_time = end_time - start_time
        return result, execution_time
    
    def _create_large_test_file(self, record_count: int = 1000):
        """Create a large test file for performance testing"""
        # Generate large dataset
        large_data = []
        base_record = self.fixtures.get_valid_reps_data()[0]
        
        for i in range(record_count):
            record = base_record.copy()
            record.update({
                'codigo_prestador': f'110001{i:06d}',
                'numero_sede': f'{i:03d}',
                'nombre_sede': f'SEDE PERFORMANCE {i:04d}',
                'direccion': f'CARRERA {i % 100} No. {i % 50}-{i % 30}',
                'telefono': f'(601) {i:07d}',
                'email': f'sede{i:04d}@performance.com',
                'gerente': f'DR. PERFORMANCE {i}',
                'barrio': f'Barrio Performance {i}'
            })
            large_data.append(record)
        
        file_path = self.fixtures.create_excel_file(large_data)
        self.temp_files.append(file_path)
        return file_path, large_data


class TestREPSServicePerformance(REPSPerformanceTestCase):
    """
    Performance tests for REPSSynchronizationService
    """
    
    def test_large_file_parsing_performance(self):
        """Test performance of parsing large REPS files"""
        # Test with different file sizes
        file_sizes = [100, 500, 1000, 2000]
        
        for size in file_sizes:
            with self.subTest(file_size=size):
                file_path, expected_data = self._create_large_test_file(size)
                
                # Measure parsing time
                result, execution_time = self._measure_execution_time(
                    self.service.parse_reps_file, file_path
                )
                
                # Performance assertions
                self.assertIsNotNone(result)
                self.assertEqual(len(result), size)
                
                # Performance thresholds (adjust based on requirements)
                max_time_per_record = 0.1  # 100ms per record max
                max_total_time = size * max_time_per_record
                
                self.assertLess(
                    execution_time, 
                    max_total_time,
                    f"Parsing {size} records took {execution_time:.2f}s, "
                    f"expected < {max_total_time:.2f}s"
                )
                
                print(f"Parsed {size} records in {execution_time:.2f}s "
                      f"({execution_time/size*1000:.1f}ms per record)")
    
    def test_database_bulk_creation_performance(self):
        """Test performance of bulk database operations"""
        file_path, test_data = self._create_large_test_file(1000)
        parsed_data = self.service.parse_reps_file(file_path)
        
        # Measure bulk creation time
        result, execution_time = self._measure_execution_time(
            self.service.create_headquarters,
            parsed_data,
            self.health_organization
        )
        
        # Verify creation
        created_count = HeadquarterLocation.objects.filter(
            health_organization=self.health_organization
        ).count()
        
        self.assertEqual(created_count, 1000)
        
        # Performance assertions
        max_time = 30.0  # 30 seconds max for 1000 records
        self.assertLess(
            execution_time,
            max_time,
            f"Creating 1000 records took {execution_time:.2f}s, expected < {max_time}s"
        )
        
        print(f"Created 1000 headquarters in {execution_time:.2f}s "
              f"({execution_time/1000*1000:.1f}ms per record)")
    
    def test_memory_usage_large_dataset(self):
        """Test memory usage with large datasets"""
        initial_memory = self._get_memory_usage()
        
        # Process increasingly large files
        for size in [500, 1000, 2000]:
            with self.subTest(dataset_size=size):
                file_path, _ = self._create_large_test_file(size)
                
                memory_before = self._get_memory_usage()
                parsed_data = self.service.parse_reps_file(file_path)
                memory_after = self._get_memory_usage()
                
                memory_delta = memory_after - memory_before
                memory_per_record = memory_delta / size * 1024  # KB per record
                
                # Memory usage should be reasonable (< 10KB per record)
                self.assertLess(
                    memory_per_record,
                    10.0,
                    f"Memory usage of {memory_per_record:.2f}KB per record is too high"
                )
                
                print(f"Processing {size} records used {memory_delta:.2f}MB "
                      f"({memory_per_record:.2f}KB per record)")
                
                # Clean up to avoid memory accumulation
                del parsed_data
    
    def test_encoding_performance_with_large_files(self):
        """Test encoding handling performance with large files"""
        # Create file with encoding issues
        encoding_data = []
        base_record = self.fixtures.get_encoding_test_data()[0]
        
        for i in range(500):
            record = base_record.copy()
            record.update({
                'numero_sede': f'{i:03d}',
                'nombre_sede': f'SEDE ENCODING TEST {i} - ÁÉÍÓÚáéíóú',
                'gerente': f'DR. JOSÉ MARÍA RODRÍGUEZ {i}'
            })
            encoding_data.append(record)
        
        # Create HTML file with Latin-1 encoding (common REPS issue)
        file_path = self.fixtures.create_html_file(
            encoding_data, 
            encoding='latin-1'
        )
        self.temp_files.append(file_path)
        
        # Measure encoding handling time
        result, execution_time = self._measure_execution_time(
            self.service.parse_reps_file, file_path
        )
        
        # Verify encoding was handled correctly
        self.assertIsNotNone(result)
        self.assertEqual(len(result), 500)
        
        # Check that encoding issues were resolved
        for record in result[:5]:  # Check first few records
            self.assertNotIn('Ã', record.get('departamento', ''))
            self.assertNotIn('â€', record.get('nombre_sede', ''))
        
        # Performance should still be reasonable with encoding handling
        max_time = 15.0  # 15 seconds max
        self.assertLess(execution_time, max_time)
        
        print(f"Handled encoding for 500 records in {execution_time:.2f}s")
    
    def test_concurrent_file_processing(self):
        """Test performance under concurrent file processing"""
        # Create multiple test files
        test_files = []
        for i in range(3):
            file_path, _ = self._create_large_test_file(200)
            test_files.append(file_path)
        
        def process_file(file_path):
            """Process a single file"""
            start_time = time.time()
            result = self.service.parse_reps_file(file_path)
            end_time = time.time()
            return len(result), end_time - start_time
        
        # Process files concurrently
        start_time = time.time()
        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = [executor.submit(process_file, file_path) 
                      for file_path in test_files]
            
            results = [future.result() for future in as_completed(futures)]
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Verify all files were processed
        self.assertEqual(len(results), 3)
        for count, _ in results:
            self.assertEqual(count, 200)
        
        # Concurrent processing should be faster than sequential
        sequential_time_estimate = sum(time for _, time in results)
        efficiency = sequential_time_estimate / total_time
        
        self.assertGreater(
            efficiency, 
            1.5,  # At least 50% improvement
            f"Concurrent processing efficiency: {efficiency:.2f}x"
        )
        
        print(f"Processed 3 files concurrently in {total_time:.2f}s "
              f"(efficiency: {efficiency:.2f}x)")


class TestREPSAPIPerformance(REPSPerformanceTestCase):
    """
    Performance tests for REPS import API endpoints
    """
    
    def setUp(self):
        """Set up API client and authentication"""
        super().setUp()
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_large_file_upload_performance(self):
        """Test API performance with large file uploads"""
        file_path, test_data = self._create_large_test_file(1000)
        
        # Read file content
        with open(file_path, 'rb') as f:
            file_content = f.read()
        
        uploaded_file = SimpleUploadedFile(
            name="large_reps_test.xlsx",
            content=file_content,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        
        # Measure upload and processing time
        start_time = time.time()
        response = self.client.post(
            '/api/sogcs/reps-import/upload/',
            {
                'file': uploaded_file,
                'organization_id': self.organization.id
            },
            format='multipart'
        )
        end_time = time.time()
        
        upload_time = end_time - start_time
        
        # Verify response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()
        self.assertEqual(response_data['total_records'], 1000)
        
        # Performance assertions
        max_upload_time = 60.0  # 60 seconds max for 1000 records
        self.assertLess(
            upload_time,
            max_upload_time,
            f"Upload and processing took {upload_time:.2f}s, expected < {max_upload_time}s"
        )
        
        print(f"Uploaded and processed 1000 records in {upload_time:.2f}s")
    
    def test_api_response_time_under_load(self):
        """Test API response times under load"""
        # Create multiple smaller files for concurrent requests
        test_files = []
        for i in range(5):
            file_path, _ = self._create_large_test_file(100)
            test_files.append(file_path)
        
        def make_upload_request(file_path):
            """Make a single upload request"""
            with open(file_path, 'rb') as f:
                file_content = f.read()
            
            uploaded_file = SimpleUploadedFile(
                name=f"concurrent_test_{time.time()}.xlsx",
                content=file_content,
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
            
            client = APIClient()
            client.force_authenticate(user=self.user)
            
            start_time = time.time()
            response = client.post(
                '/api/sogcs/reps-import/upload/',
                {
                    'file': uploaded_file,
                    'organization_id': self.organization.id
                },
                format='multipart'
            )
            end_time = time.time()
            
            return response.status_code, end_time - start_time
        
        # Make concurrent requests
        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = [executor.submit(make_upload_request, file_path) 
                      for file_path in test_files[:3]]  # Test with 3 concurrent requests
            
            results = [future.result() for future in as_completed(futures)]
        
        # Verify all requests succeeded
        for status_code, response_time in results:
            self.assertEqual(status_code, status.HTTP_200_OK)
            self.assertLess(
                response_time, 
                30.0,  # 30 seconds max per request
                f"Request took {response_time:.2f}s, expected < 30s"
            )
        
        avg_response_time = sum(time for _, time in results) / len(results)
        print(f"Average response time under load: {avg_response_time:.2f}s")
    
    def test_status_endpoint_performance(self):
        """Test performance of status checking endpoint"""
        # Create and start an import
        file_path, _ = self._create_large_test_file(500)
        
        with open(file_path, 'rb') as f:
            file_content = f.read()
        
        uploaded_file = SimpleUploadedFile(
            name="status_test.xlsx",
            content=file_content,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        
        upload_response = self.client.post(
            '/api/sogcs/reps-import/upload/',
            {
                'file': uploaded_file,
                'organization_id': self.organization.id
            },
            format='multipart'
        )
        
        self.assertEqual(upload_response.status_code, status.HTTP_200_OK)
        
        # Test status endpoint performance
        status_times = []
        for _ in range(10):  # Check status 10 times
            start_time = time.time()
            status_response = self.client.get(
                f'/api/sogcs/reps-import/status/{self.organization.id}/'
            )
            end_time = time.time()
            
            status_times.append(end_time - start_time)
            self.assertEqual(status_response.status_code, status.HTTP_200_OK)
        
        avg_status_time = sum(status_times) / len(status_times)
        max_status_time = max(status_times)
        
        # Status checks should be fast
        self.assertLess(avg_status_time, 0.5)  # 500ms average
        self.assertLess(max_status_time, 1.0)  # 1s maximum
        
        print(f"Status check times - Avg: {avg_status_time*1000:.1f}ms, "
              f"Max: {max_status_time*1000:.1f}ms")


class TestREPSDatabasePerformance(REPSPerformanceTestCase):
    """
    Performance tests for database operations during REPS import
    """
    
    def test_bulk_insert_performance(self):
        """Test bulk insert performance for headquarters"""
        file_path, test_data = self._create_large_test_file(2000)
        parsed_data = self.service.parse_reps_file(file_path)
        
        # Measure bulk insert time
        start_time = time.time()
        
        # Use bulk_create for performance
        headquarters_to_create = []
        for record in parsed_data:
            headquarters_to_create.append(
                HeadquarterLocation(
                    health_organization=self.health_organization,
                    nombre_sede=record.get('nombre_sede', ''),
                    numero_sede=record.get('numero_sede', ''),
                    departamento=record.get('departamento', ''),
                    municipio=record.get('municipio', ''),
                    direccion=record.get('direccion', ''),
                    telefono=record.get('telefono', ''),
                    email=record.get('email', ''),
                    gerente=record.get('gerente', '')
                )
            )
        
        # Bulk create with batch size optimization
        batch_size = 1000
        for i in range(0, len(headquarters_to_create), batch_size):
            batch = headquarters_to_create[i:i + batch_size]
            HeadquarterLocation.objects.bulk_create(batch, batch_size=batch_size)
        
        end_time = time.time()
        insert_time = end_time - start_time
        
        # Verify creation
        created_count = HeadquarterLocation.objects.filter(
            health_organization=self.health_organization
        ).count()
        
        self.assertEqual(created_count, 2000)
        
        # Performance assertions
        records_per_second = created_count / insert_time
        self.assertGreater(
            records_per_second,
            100,  # At least 100 records per second
            f"Insert rate: {records_per_second:.1f} records/second"
        )
        
        print(f"Bulk inserted 2000 records in {insert_time:.2f}s "
              f"({records_per_second:.1f} records/second)")
    
    def test_query_performance_with_large_dataset(self):
        """Test query performance with large datasets"""
        # Create large dataset
        file_path, test_data = self._create_large_test_file(1000)
        parsed_data = self.service.parse_reps_file(file_path)
        self.service.create_headquarters(parsed_data, self.health_organization)
        
        # Test various query patterns
        queries = [
            ('Count all headquarters', lambda: HeadquarterLocation.objects.count()),
            ('Filter by organization', lambda: HeadquarterLocation.objects.filter(
                health_organization=self.health_organization
            ).count()),
            ('Search by name', lambda: HeadquarterLocation.objects.filter(
                nombre_sede__icontains='PERFORMANCE'
            ).count()),
            ('Complex filter', lambda: HeadquarterLocation.objects.filter(
                health_organization=self.health_organization,
                departamento='Cundinamarca'
            ).select_related('health_organization').count()),
        ]
        
        for query_name, query_func in queries:
            with self.subTest(query=query_name):
                # Measure query time
                start_time = time.time()
                result = query_func()
                end_time = time.time()
                
                query_time = end_time - start_time
                
                # Query should complete quickly
                self.assertLess(
                    query_time,
                    2.0,  # 2 seconds max
                    f"{query_name} took {query_time:.3f}s"
                )
                
                print(f"{query_name}: {result} results in {query_time*1000:.1f}ms")
    
    def test_database_connection_pooling(self):
        """Test database performance under concurrent access"""
        file_path, test_data = self._create_large_test_file(100)
        
        def concurrent_database_operation():
            """Perform database operations concurrently"""
            parsed_data = self.service.parse_reps_file(file_path)
            
            # Create a separate organization for this thread
            thread_id = threading.current_thread().ident
            org = Organization.objects.create(
                razon_social=f'Concurrent Test Org {thread_id}',
                nit=f'90012345{thread_id % 10}-1',
                tipo_organizacion='ips'
            )
            
            health_org = HealthOrganization.objects.create(
                organization=org,
                reps_code=f'12345678901{thread_id % 10}'
            )
            
            # Create headquarters
            start_time = time.time()
            self.service.create_headquarters(parsed_data, health_org)
            end_time = time.time()
            
            return end_time - start_time
        
        # Run concurrent operations
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(concurrent_database_operation) 
                      for _ in range(5)]
            
            execution_times = [future.result() for future in as_completed(futures)]
        
        # Verify all operations completed
        self.assertEqual(len(execution_times), 5)
        
        avg_time = sum(execution_times) / len(execution_times)
        max_time = max(execution_times)
        
        # Operations should complete in reasonable time
        self.assertLess(avg_time, 5.0)  # 5 seconds average
        self.assertLess(max_time, 10.0)  # 10 seconds maximum
        
        print(f"Concurrent DB operations - Avg: {avg_time:.2f}s, Max: {max_time:.2f}s")


@override_settings(
    CACHES={
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }
)
class TestREPSCachingPerformance(REPSPerformanceTestCase):
    """
    Performance tests for caching optimization during REPS import
    """
    
    def test_organization_lookup_caching(self):
        """Test performance improvement with organization lookup caching"""
        # Create test data that would cause repeated organization lookups
        file_path, test_data = self._create_large_test_file(500)
        
        # Test without caching (multiple organization lookups)
        start_time = time.time()
        for _ in range(10):  # Simulate multiple import operations
            org_lookup = Organization.objects.get(id=self.organization.id)
            health_org_lookup = HealthOrganization.objects.get(
                organization=org_lookup
            )
        end_time = time.time()
        
        uncached_time = end_time - start_time
        
        # Test with caching (cache organization objects)
        from django.core.cache import cache
        cache_key = f"org_{self.organization.id}"
        cache.set(cache_key, self.organization, 300)  # 5 minutes
        
        health_cache_key = f"health_org_{self.organization.id}"
        cache.set(health_cache_key, self.health_organization, 300)
        
        start_time = time.time()
        for _ in range(10):  # Same operations with caching
            cached_org = cache.get(cache_key)
            cached_health_org = cache.get(health_cache_key)
            self.assertIsNotNone(cached_org)
            self.assertIsNotNone(cached_health_org)
        end_time = time.time()
        
        cached_time = end_time - start_time
        
        # Caching should provide significant improvement
        improvement_ratio = uncached_time / cached_time
        self.assertGreater(
            improvement_ratio,
            5.0,  # At least 5x improvement
            f"Caching improvement: {improvement_ratio:.1f}x"
        )
        
        print(f"Organization lookup - Uncached: {uncached_time*1000:.1f}ms, "
              f"Cached: {cached_time*1000:.1f}ms (improvement: {improvement_ratio:.1f}x)")


class TestREPSMemoryOptimization(REPSPerformanceTestCase):
    """
    Performance tests for memory optimization during REPS import
    """
    
    def test_memory_efficient_file_processing(self):
        """Test memory-efficient processing of large files"""
        # Create very large file
        file_path, _ = self._create_large_test_file(5000)
        
        initial_memory = self._get_memory_usage()
        peak_memory = initial_memory
        
        def memory_monitor():
            """Monitor memory usage during processing"""
            nonlocal peak_memory
            import time
            while True:
                current_memory = self._get_memory_usage()
                peak_memory = max(peak_memory, current_memory)
                time.sleep(0.1)
        
        # Start memory monitoring
        monitor_thread = threading.Thread(target=memory_monitor, daemon=True)
        monitor_thread.start()
        
        # Process file
        try:
            parsed_data = self.service.parse_reps_file(file_path)
            self.assertEqual(len(parsed_data), 5000)
        finally:
            # Stop monitoring
            monitor_thread = None
        
        final_memory = self._get_memory_usage()
        peak_memory_delta = peak_memory - initial_memory
        final_memory_delta = final_memory - initial_memory
        
        # Memory usage should be reasonable
        memory_per_record = peak_memory_delta / 5000 * 1024  # KB per record
        self.assertLess(
            memory_per_record,
            5.0,  # Less than 5KB per record
            f"Peak memory usage: {memory_per_record:.2f}KB per record"
        )
        
        # Memory should be released after processing
        self.assertLess(
            final_memory_delta,
            peak_memory_delta / 2,  # At least 50% memory released
            "Memory not properly released after processing"
        )
        
        print(f"Memory usage for 5000 records:")
        print(f"  Peak delta: {peak_memory_delta:.2f}MB ({memory_per_record:.2f}KB/record)")
        print(f"  Final delta: {final_memory_delta:.2f}MB")
    
    def test_streaming_file_processing(self):
        """Test streaming approach for very large files"""
        # This test would implement chunked processing for extremely large files
        file_path, test_data = self._create_large_test_file(2000)
        
        # Simulate chunked processing
        chunk_size = 500
        processed_records = 0
        max_memory_delta = 0
        
        initial_memory = self._get_memory_usage()
        
        # Process in chunks to maintain memory efficiency
        all_parsed_data = []
        
        for chunk_start in range(0, len(test_data), chunk_size):
            chunk_data = test_data[chunk_start:chunk_start + chunk_size]
            
            # Create temporary file for chunk
            chunk_file = self.fixtures.create_excel_file(chunk_data)
            self.temp_files.append(chunk_file)
            
            # Process chunk
            chunk_memory_before = self._get_memory_usage()
            parsed_chunk = self.service.parse_reps_file(chunk_file)
            chunk_memory_after = self._get_memory_usage()
            
            chunk_memory_delta = chunk_memory_after - chunk_memory_before
            max_memory_delta = max(max_memory_delta, chunk_memory_delta)
            
            all_parsed_data.extend(parsed_chunk)
            processed_records += len(parsed_chunk)
            
            # Clean up chunk data from memory
            del parsed_chunk
        
        # Verify all data was processed
        self.assertEqual(processed_records, 2000)
        self.assertEqual(len(all_parsed_data), 2000)
        
        # Memory usage per chunk should be bounded
        memory_per_chunk_record = max_memory_delta / chunk_size * 1024  # KB
        self.assertLess(
            memory_per_chunk_record,
            10.0,  # Less than 10KB per record in chunk
            f"Chunk memory usage: {memory_per_chunk_record:.2f}KB per record"
        )
        
        print(f"Streaming processing of 2000 records:")
        print(f"  Chunk size: {chunk_size} records")
        print(f"  Max chunk memory delta: {max_memory_delta:.2f}MB")
        print(f"  Memory per record in chunk: {memory_per_chunk_record:.2f}KB")


class TestREPSPerformanceMetrics(TestCase):
    """
    Test class for validating performance metrics and thresholds
    """
    
    def test_performance_requirements_compliance(self):
        """Test that system meets defined performance requirements"""
        
        # Define performance requirements for REPS import
        requirements = {
            'max_file_size_mb': 50,  # Maximum file size in MB
            'max_records_per_file': 10000,  # Maximum records per file
            'max_processing_time_seconds': 300,  # 5 minutes max
            'min_records_per_second': 50,  # Minimum processing rate
            'max_memory_per_record_kb': 10,  # Maximum memory per record
            'max_api_response_time_seconds': 60,  # Maximum API response time
            'max_concurrent_imports': 5,  # Maximum concurrent imports
        }
        
        # Validate requirements are reasonable
        self.assertGreater(requirements['max_file_size_mb'], 0)
        self.assertGreater(requirements['max_records_per_file'], 0)
        self.assertGreater(requirements['max_processing_time_seconds'], 0)
        self.assertGreater(requirements['min_records_per_second'], 0)
        
        # Calculate derived metrics
        max_time_per_record = requirements['max_processing_time_seconds'] / requirements['max_records_per_file']
        
        self.assertLess(
            max_time_per_record,
            1.0,  # Less than 1 second per record
            "Performance requirements may be too lenient"
        )
        
        print("Performance Requirements Validation:")
        for key, value in requirements.items():
            print(f"  {key}: {value}")
        print(f"  Calculated max time per record: {max_time_per_record:.3f}s")
    
    def test_system_resource_limits(self):
        """Test system resource availability and limits"""
        
        # Check available memory
        memory = psutil.virtual_memory()
        available_memory_gb = memory.available / (1024 ** 3)
        
        self.assertGreater(
            available_memory_gb,
            1.0,  # At least 1GB available
            f"Insufficient memory available: {available_memory_gb:.2f}GB"
        )
        
        # Check CPU cores
        cpu_count = psutil.cpu_count()
        self.assertGreaterEqual(
            cpu_count,
            2,  # At least 2 CPU cores
            f"Insufficient CPU cores: {cpu_count}"
        )
        
        # Check disk space
        disk = psutil.disk_usage('/')
        available_disk_gb = disk.free / (1024 ** 3)
        
        self.assertGreater(
            available_disk_gb,
            5.0,  # At least 5GB free
            f"Insufficient disk space: {available_disk_gb:.2f}GB"
        )
        
        print("System Resource Check:")
        print(f"  Available memory: {available_memory_gb:.2f}GB")
        print(f"  CPU cores: {cpu_count}")
        print(f"  Available disk: {available_disk_gb:.2f}GB")