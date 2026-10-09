<?php
declare(strict_types=1);

namespace Tests;

use App\Services\WebFetchService;
use PHPUnit\Framework\TestCase;

final class WebFetchServiceTest extends TestCase
{
    public function testNegotiationDoesNotAdvertiseBrotliWhenLibcurlCannotDecodeIt(): void
    {
        self::assertSame('gzip, deflate', WebFetchService::supportedContentEncodings(0));
    }

    public function testUnsupportedCompressedResponseIsRecognized(): void
    {
        $technicalError = 'Unrecognized content encoding type. libcurl understands deflate, gzip content encodings.';

        self::assertTrue(WebFetchService::isUnsupportedContentEncodingError(61, $technicalError));
        self::assertTrue(WebFetchService::isUnsupportedContentEncodingError(0, $technicalError));
    }

    public function testUnrelatedNetworkErrorIsNotClassifiedAsCompressionFailure(): void
    {
        self::assertFalse(WebFetchService::isUnsupportedContentEncodingError(28, 'Operation timed out'));
    }
}
